import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

/**
 * Reusable Blender 3D Asset Pipeline & Resource Manager
 * Handles:
 * - Asynchronous GLB/glTF loading with in-memory caching
 * - Concurrent request deduplication
 * - Automated shadow flag propagation (castShadow / receiveShadow)
 * - Automated collision proxy extraction (-col meshes or calculated AABB/cylinder)
 * - Material & geometry sharing for draw call minimization
 * - Resource disposal and memory leak prevention
 */
export class AssetPipeline {
  constructor() {
    this.loader = new GLTFLoader();
    this.cache = new Map(); // url -> template Object3D
    this.inFlight = new Map(); // url -> Promise<Object3D>
    this.instanceCount = 0;
  }

  /**
   * Loads a GLTF/GLB model asynchronously or returns a cached clone.
   * @param {string} url Model URL / path
   * @param {Object} options Configuration options
   * @returns {Promise<{ model: THREE.Object3D, colliders: Array }>}
   */
  async loadModel(url, options = {}) {
    const {
      castShadow = true,
      receiveShadow = true,
      collision = 'box', // 'box' | 'cylinder' | 'none'
      scale = 1.0,
      autoCenter = false
    } = options;

    let template = this.cache.get(url);

    if (!template) {
      if (this.inFlight.has(url)) {
        template = await this.inFlight.get(url);
      } else {
        const loadPromise = new Promise((resolve, reject) => {
          this.loader.load(
            url,
            (gltf) => {
              const scene = gltf.scene;

              // Ensure standard scaling
              scene.scale.set(1, 1, 1);

              // Process meshes, materials, and collision tags
              scene.traverse((child) => {
                if (child.isMesh) {
                  child.castShadow = castShadow;
                  child.receiveShadow = receiveShadow;

                  // Detect dedicated collision mesh (e.g. named *-col, *_col or *collider*)
                  const lowerName = child.name.toLowerCase();
                  if (lowerName.includes('-col') || lowerName.includes('_col') || lowerName.includes('collider')) {
                    child.visible = false;
                    child.userData.isColliderMesh = true;
                  }

                  // Optimize material settings if needed
                  if (child.material) {
                    if (Array.isArray(child.material)) {
                      child.material.forEach(m => this.tuneMaterial(m));
                    } else {
                      this.tuneMaterial(child.material);
                    }
                  }
                }
              });

              this.cache.set(url, scene);
              this.inFlight.delete(url);
              resolve(scene);
            },
            undefined,
            (err) => {
              this.inFlight.delete(url);
              console.error(`[AssetPipeline] Failed to load model at ${url}:`, err);
              reject(err);
            }
          );
        });

        this.inFlight.set(url, loadPromise);
        template = await loadPromise;
      }
    }

    // Clone template hierarchy for this specific instance
    const clone = this.deepCloneModel(template);
    this.instanceCount++;

    if (scale !== 1.0) {
      if (typeof scale === 'number') {
        clone.scale.set(scale, scale, scale);
      } else if (scale.isVector3) {
        clone.scale.copy(scale);
      }
    }

    if (autoCenter) {
      const box = new THREE.Box3().setFromObject(clone);
      const center = new THREE.Vector3();
      box.getCenter(center);
      clone.position.sub(center);
    }

    // Extract collision proxies
    const colliders = this.extractColliders(clone, collision);

    return { model: clone, colliders };
  }

  /**
   * Clones an Object3D hierarchy, preserving shared geometries and materials for batching
   */
  deepCloneModel(source) {
    const clone = source.clone(true);
    return clone;
  }

  /**
   * Fine-tunes standard materials for consistent stylized realism
   */
  tuneMaterial(mat) {
    if (!mat) return;
    mat.dithering = true;
    const name = (mat.name || '').toLowerCase();
    if (name.includes('glass') || name.includes('window')) {
      mat.transparent = true;
      mat.opacity = 0.55;
      mat.roughness = 0.12;
      mat.metalness = 0.18;
      mat.depthWrite = false;
      mat.needsUpdate = true;
      return;
    }
    if (mat.roughness !== undefined && mat.roughness < 0.2) {
      mat.roughness = 0.45;
    }
  }

  /**
   * Generates or extracts collision proxies from the loaded hierarchy
   */
  extractColliders(object, defaultType = 'box') {
    object.updateMatrixWorld(true);
    const colliders = [];

    // Check for explicit collider children first
    let foundExplicit = false;
    object.traverse((child) => {
      if (child.userData && child.userData.isColliderMesh) {
        foundExplicit = true;
        const box = new THREE.Box3().setFromObject(child);
        colliders.push({
          type: 'box',
          box,
          mesh: child
        });
      }
    });

    if (foundExplicit) return colliders;

    // Generate fallback proxy from bounding box if requested
    if (defaultType === 'box') {
      const box = new THREE.Box3().setFromObject(object);
      colliders.push({
        type: 'box',
        box,
        mesh: object
      });
    } else if (defaultType === 'cylinder') {
      const box = new THREE.Box3().setFromObject(object);
      const size = new THREE.Vector3();
      box.getSize(size);
      const radius = Math.max(size.x, size.z) / 2;
      colliders.push({
        type: 'cylinder',
        x: object.position.x,
        z: object.position.z,
        radius,
        height: size.y,
        mesh: object
      });
    }

    return colliders;
  }

  /**
   * Preloads multiple model URLs concurrently
   * @param {string[]} urls 
   */
  async preloadAll(urls) {
    return Promise.all(urls.map(url => this.loadModel(url)));
  }

  /**
   * Safely disposes an Object3D and frees GPU memory
   */
  disposeHierarchy(object) {
    if (!object) return;
    object.traverse((child) => {
      if (child.isMesh) {
        if (child.geometry) {
          child.geometry.dispose();
        }
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(m => this.disposeMaterial(m));
          } else {
            this.disposeMaterial(child.material);
          }
        }
      }
    });
    if (object.parent) {
      object.parent.remove(object);
    }
  }

  disposeMaterial(mat) {
    if (!mat) return;
    Object.keys(mat).forEach((key) => {
      if (mat[key] && mat[key].isTexture) {
        mat[key].dispose();
      }
    });
    mat.dispose();
  }

  getStats() {
    return {
      cachedTemplates: this.cache.size,
      activeInstances: this.instanceCount
    };
  }
}

// Global shared pipeline singleton
export const assetPipeline = new AssetPipeline();
