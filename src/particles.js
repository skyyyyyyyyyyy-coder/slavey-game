import * as THREE from 'three';

/**
 * Lightweight, high-performance particle system using instancing/points.
 */
export class ParticleManager {
  constructor(scene) {
    this.scene = scene;
    this.maxParticles = 600;

    const geometry = new THREE.BufferGeometry();
    this.positions = new Float32Array(this.maxParticles * 3);
    this.colors = new Float32Array(this.maxParticles * 3);
    this.sizes = new Float32Array(this.maxParticles);

    geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(this.sizes, 1));

    // Create a smooth round circular texture dynamically
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.3, 'rgba(255,255,255,0.8)');
    grad.addColorStop(0.8, 'rgba(255,255,255,0.15)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);

    const texture = new THREE.CanvasTexture(canvas);

    const material = new THREE.PointsMaterial({
      size: 0.35,
      map: texture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      vertexColors: true
    });

    this.points = new THREE.Points(geometry, material);
    this.points.frustumCulled = false;
    this.scene.add(this.points);

    this.particles = [];
    for (let i = 0; i < this.maxParticles; i++) {
      this.particles.push({
        active: false,
        x: 0, y: 0, z: 0,
        vx: 0, vy: 0, vz: 0,
        r: 1, g: 1, b: 1,
        life: 0,
        maxLife: 1,
        size: 0.2
      });
    }
  }

  emit(options) {
    const count = options.count || 10;
    const color = options.color || new THREE.Color(1, 0.8, 0.2);
    const speed = options.speed || 3;
    const spread = options.spread || 1.0;
    const size = options.size || 0.25;
    const life = options.life || 0.6;
    const origin = options.origin || new THREE.Vector3();

    let emitted = 0;
    for (let i = 0; i < this.maxParticles && emitted < count; i++) {
      const p = this.particles[i];
      if (!p.active) {
        p.active = true;
        p.x = origin.x;
        p.y = origin.y;
        p.z = origin.z;

        // Random spherical or directional velocity
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        const s = (Math.random() * 0.7 + 0.3) * speed;

        p.vx = Math.sin(phi) * Math.cos(theta) * s * spread;
        p.vy = Math.cos(phi) * s + (options.upwardBias || 0);
        p.vz = Math.sin(phi) * Math.sin(theta) * s * spread;

        p.r = color.r;
        p.g = color.g;
        p.b = color.b;

        p.life = life * (0.8 + Math.random() * 0.4);
        p.maxLife = p.life;
        p.size = size;

        emitted++;
      }
    }
  }

  // Quick preset emitters
  emitSparks(origin, color = new THREE.Color(0.2, 0.9, 1)) {
    this.emit({
      origin,
      count: 22,
      color,
      speed: 6.0,
      size: 0.28,
      life: 0.45,
      upwardBias: 2.0
    });
  }

  emitPickup(origin) {
    this.emit({
      origin,
      count: 35,
      color: new THREE.Color(0.3, 1.0, 0.6),
      speed: 4.5,
      size: 0.32,
      life: 0.7,
      upwardBias: 2.5
    });
  }

  emitJumpPad(origin) {
    this.emit({
      origin,
      count: 30,
      color: new THREE.Color(0.9, 0.3, 1.0),
      speed: 5.5,
      size: 0.35,
      life: 0.6,
      upwardBias: 6.0
    });
  }

  emitLandDust(origin) {
    this.emit({
      origin,
      count: 16,
      color: new THREE.Color(0.8, 0.8, 0.8),
      speed: 2.5,
      size: 0.2,
      life: 0.35,
      upwardBias: 0.4
    });
  }

  // Farming action emitters
  emitDirtPuff(origin) {
    this.emit({
      origin,
      count: 24,
      color: new THREE.Color(0.48, 0.30, 0.16),
      speed: 2.4,
      size: 0.28,
      life: 0.45,
      upwardBias: 1.4
    });
  }

  emitWaterSplash(origin) {
    this.emit({
      origin,
      count: 26,
      color: new THREE.Color(0.24, 0.65, 1.0),
      speed: 2.8,
      size: 0.24,
      life: 0.5,
      upwardBias: 2.2
    });
  }

  emitSeedPlant(origin) {
    this.emit({
      origin,
      count: 16,
      color: new THREE.Color(0.52, 0.82, 0.32),
      speed: 1.8,
      size: 0.22,
      life: 0.4,
      upwardBias: 1.1
    });
  }

  emitHarvestPop(origin) {
    this.emit({
      origin,
      count: 36,
      color: new THREE.Color(1.0, 0.86, 0.24),
      speed: 4.2,
      size: 0.34,
      life: 0.65,
      upwardBias: 3.2
    });
  }

  update(dt) {
    const posAttr = this.points.geometry.attributes.position;
    const colAttr = this.points.geometry.attributes.color;
    const sizeAttr = this.points.geometry.attributes.size;

    let idx = 0;
    for (let i = 0; i < this.maxParticles; i++) {
      const p = this.particles[i];
      if (p.active) {
        p.life -= dt;
        if (p.life <= 0) {
          p.active = false;
          posAttr.setXYZ(i, 0, -9999, 0);
          continue;
        }

        // Apply motion & gravity
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.z += p.vz * dt;
        p.vy -= 9.8 * dt * 0.6; // gentle particle gravity

        const alpha = p.life / p.maxLife;
        posAttr.setXYZ(i, p.x, p.y, p.z);
        colAttr.setXYZ(i, p.r * alpha, p.g * alpha, p.b * alpha);
        sizeAttr.setX(i, p.size * alpha);
      } else {
        posAttr.setXYZ(i, 0, -9999, 0);
      }
    }

    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
    sizeAttr.needsUpdate = true;
  }
}
