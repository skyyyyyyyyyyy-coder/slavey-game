import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { sounds } from './audio.js';
import { events } from './events.js';
import { assetPipeline } from './assetPipeline.js';

/**
 * Procedural lush alpine grass texture with natural dapples and meadow blossoms
 */
function createGrassTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // Rich warm spring emerald base
  ctx.fillStyle = '#4da738';
  ctx.fillRect(0, 0, 512, 512);

  // Soft natural tonal variations (warm meadow greens)
  const tones = ['#429b30', '#56b840', '#60c448', '#3b8c2a', '#50ad36', '#48a232'];
  for (let i = 0; i < 4500; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const r = 4 + Math.random() * 10;
    ctx.fillStyle = tones[Math.floor(Math.random() * tones.length)];
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Soft subtle blade texture in harmonized natural greens
  for (let i = 0; i < 3500; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const len = 3 + Math.random() * 5;
    ctx.strokeStyle = Math.random() > 0.5 ? '#4da23c' : '#39842c';
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (Math.random() - 0.5) * 2, y - len);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

/**
 * Rich dark organic loam soil texture with clear furrow ridges
 */
function createSoilTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#321f11';
  ctx.fillRect(0, 0, 256, 256);

  ctx.strokeStyle = '#1e1108';
  ctx.lineWidth = 18;
  for (let y = 16; y <= 256; y += 32) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(256, y);
    ctx.stroke();
  }

  ctx.strokeStyle = '#482e18';
  ctx.lineWidth = 8;
  for (let y = 32; y <= 256; y += 32) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(256, y);
    ctx.stroke();
  }

  for (let i = 0; i < 1000; i++) {
    ctx.fillStyle = Math.random() > 0.5 ? '#55371e' : '#140a04';
    ctx.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

/**
 * Compacted country lane texture with embedded river cobblestones
 */
function createPathTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#9b8261';
  ctx.fillRect(0, 0, 512, 512);

  // Wheel ruts
  ctx.fillStyle = '#866e4e';
  ctx.fillRect(80, 0, 110, 512);
  ctx.fillRect(320, 0, 110, 512);

  const stoneColors = ['#75614a', '#a38a6d', '#66523d', '#b39c7e', '#5a4734', '#bfa98b'];
  for (let i = 0; i < 3000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const rx = 2 + Math.random() * 5;
    const ry = 2 + Math.random() * 5;
    ctx.fillStyle = stoneColors[Math.floor(Math.random() * stoneColors.length)];
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, Math.random() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }

  // Edge moss
  for (let i = 0; i < 1200; i++) {
    const x = Math.random() > 0.5 ? Math.random() * 65 : 447 + Math.random() * 65;
    const y = Math.random() * 512;
    ctx.fillStyle = '#488c38';
    ctx.beginPath();
    ctx.arc(x, y, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

/**
 * Cedar timber plank texture
 */
function createWoodTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#784c28';
  ctx.fillRect(0, 0, 256, 256);

  ctx.strokeStyle = '#4e2f16';
  ctx.lineWidth = 4;
  for (let y = 32; y < 256; y += 32) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(256, y);
    ctx.stroke();
  }

  for (let i = 0; i < 800; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    const len = 10 + Math.random() * 30;
    ctx.strokeStyle = Math.random() > 0.5 ? '#8d5d34' : '#57361a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + len, y);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

/**
 * Weathered slate shake roof texture
 */
function createRoofTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#2d3748';
  ctx.fillRect(0, 0, 256, 256);

  ctx.strokeStyle = '#1a202c';
  ctx.lineWidth = 4;
  for (let y = 20; y < 256; y += 20) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(256, y);
    ctx.stroke();
  }

  for (let y = 0; y < 256; y += 20) {
    const offset = (Math.floor(y / 20) % 2) * 18;
    for (let x = offset; x < 256; x += 36) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + 20);
      ctx.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

/**
 * Fieldstone masonry texture
 */
function createStoneTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#64748b';
  ctx.fillRect(0, 0, 256, 256);

  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 4;
  for (let y = 24; y < 256; y += 24) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(256, y);
    ctx.stroke();
  }

  for (let y = 0; y < 256; y += 24) {
    const offset = (Math.floor(y / 24) % 2) * 24;
    for (let x = offset; x < 256; x += 48) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + 24);
      ctx.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

export class World {
  constructor(scene, collisionWorld, particleManager) {
    this.scene = scene;
    this.world = collisionWorld;
    this.particles = particleManager;

    this.interactables = [];
    this.fruitTrees = [];
    this.cropPlants = [];
    this.animatedFoliage = [];
    this.clouds = [];
    this.smokeParticles = [];

    // Stylized materials with smooth organic shading and cohesive art direction
    this.materials = {
      trunk: new THREE.MeshStandardMaterial({ color: 0x54371e, roughness: 0.85, flatShading: false }),
      birchTrunk: new THREE.MeshStandardMaterial({ color: 0xf4f1e8, roughness: 0.65, flatShading: false }),
      birchSpots: new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.9 }),
      leafVibrant: new THREE.MeshStandardMaterial({ color: 0x38a169, roughness: 0.7, flatShading: false }),
      leafLight: new THREE.MeshStandardMaterial({ color: 0x48bb78, roughness: 0.7, flatShading: false }),
      leafSun: new THREE.MeshStandardMaterial({ color: 0x68d391, roughness: 0.7, flatShading: false }),
      leafDeep: new THREE.MeshStandardMaterial({ color: 0x22543d, roughness: 0.75, flatShading: false }),
      leafPine: new THREE.MeshStandardMaterial({ color: 0x1c4532, roughness: 0.8, flatShading: false }),
      birchLeaf: new THREE.MeshStandardMaterial({ color: 0x84cc16, roughness: 0.65, flatShading: false }),
      apple: new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3, metalness: 0.08 }),
      appleStem: new THREE.MeshStandardMaterial({ color: 0x276749, roughness: 0.7 }),
      wood: new THREE.MeshStandardMaterial({ map: createWoodTexture(), roughness: 0.8 }),
      timberLog: new THREE.MeshStandardMaterial({ color: 0x4a2e16, roughness: 0.85, flatShading: false }),
      stoneWall: new THREE.MeshStandardMaterial({ map: createStoneTexture(), roughness: 0.9 }),
      stone: new THREE.MeshStandardMaterial({ color: 0x6b7280, roughness: 0.9, flatShading: true }),
      brick: new THREE.MeshStandardMaterial({ color: 0x9a3412, roughness: 0.85, flatShading: true }),
      roof: new THREE.MeshStandardMaterial({ map: createRoofTexture(), roughness: 0.72 }),
      whiteStucco: new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.88 }),
      windowWarm: new THREE.MeshStandardMaterial({
        color: 0xfef08a,
        emissive: 0xfacc15,
        emissiveIntensity: 0.45,
        roughness: 0.25
      }),
      bushDark: new THREE.MeshStandardMaterial({ color: 0x22543d, roughness: 0.75, flatShading: true }),
      bushBright: new THREE.MeshStandardMaterial({ color: 0x38a169, roughness: 0.70, flatShading: true }),
      straw: new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.85, flatShading: true }),
      strawTwine: new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 }),
      ironMetal: new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5, metalness: 0.7 }),
      poppy: new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.6 }),
      buttercup: new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.6 })
    };

    this.initSkyAndLighting();
    this.buildMeadowAndTerrace();
    this.buildLayeredMountainHorizon();
    this.buildAlpineFarmhouse();
    this.buildFarmhouseInterior();
    this.buildCropFields();
    this.buildFacetedTrees();
    this.buildEnvironmentalStorytelling();
    this.buildVegetationLayers();
  }

  initSkyAndLighting() {
    // Soft Mountain Basin Fog (gentle, preserves clear visibility of farm estate)
    this.scene.fog = new THREE.FogExp2(0xbcd7f5, 0.0038);

    // Layered Fluffy Cumulus Clouds
    this.createClouds();
  }

  createClouds() {
    // Upgraded Stylized-Realistic Volumetric Cloud Formations
    // Matches Reference Board 2:
    // - Cumulus clusters with broad puffy bases and tiered billows
    // - Layered formations with varied altitude decks (55m - 95m)
    // - Vertical build-ups and wispy distant horizon banks
    // - Natural asymmetry and drift dynamics
    const cloudWhiteMat = new THREE.MeshLambertMaterial({
      color: 0xffffff,
      flatShading: true,
      transparent: true,
      opacity: 0.94,
      fog: true
    });
    const cloudShadeMat = new THREE.MeshLambertMaterial({
      color: 0xe2e8f0, // Soft atmospheric slate-blue ambient underside
      flatShading: true,
      transparent: true,
      opacity: 0.92,
      fog: true
    });
    this.cloudMaterial = cloudWhiteMat;

    // 16 Curated Volumetric Cloud Formations with varied architectural structure
    const cloudDeckConfigs = [
      // Large towering cumulus vertical build-ups
      { x: -90, z: -110, y: 72, scale: 1.45, puffs: 9, speed: 0.28, type: 'tower' },
      { x: 30,  z: -125, y: 76, scale: 1.60, puffs: 10, speed: 0.25, type: 'tower' },
      { x: 110, z: -100, y: 70, scale: 1.35, puffs: 8, speed: 0.30, type: 'tower' },

      // Mid-level sweeping layered cumulus banks
      { x: -120, z: -30,  y: 65, scale: 1.30, puffs: 7, speed: 0.35, type: 'bank' },
      { x: -60,  z: 15,   y: 62, scale: 1.20, puffs: 6, speed: 0.38, type: 'bank' },
      { x: 20,   z: -25,  y: 68, scale: 1.25, puffs: 7, speed: 0.34, type: 'bank' },
      { x: 85,   z: 25,   y: 64, scale: 1.20, puffs: 6, speed: 0.36, type: 'bank' },
      { x: 130,  z: -20,  y: 66, scale: 1.30, puffs: 7, speed: 0.32, type: 'bank' },

      // Southern horizon layered formations
      { x: -80, z: 110, y: 74, scale: 1.40, puffs: 8, speed: 0.26, type: 'bank' },
      { x: 0,   z: 125, y: 78, scale: 1.50, puffs: 9, speed: 0.24, type: 'tower' },
      { x: 80,  z: 115, y: 72, scale: 1.35, puffs: 8, speed: 0.27, type: 'bank' },

      // Soft high-altitude wispy decks
      { x: -40, z: -70, y: 88, scale: 1.10, puffs: 5, speed: 0.42, type: 'wispy' },
      { x: 60,  z: -65, y: 92, scale: 1.15, puffs: 5, speed: 0.40, type: 'wispy' },
      { x: -95, z: 60,  y: 86, scale: 1.05, puffs: 5, speed: 0.44, type: 'wispy' },
      { x: 50,  z: 75,  y: 90, scale: 1.10, puffs: 5, speed: 0.42, type: 'wispy' },
      { x: -10, z: 0,   y: 84, scale: 1.15, puffs: 6, speed: 0.38, type: 'bank' }
    ];

    cloudDeckConfigs.forEach((cfg, cIdx) => {
      const cloudGroup = new THREE.Group();

      for (let p = 0; p < cfg.puffs; p++) {
        const pt = p / cfg.puffs;
        // Base puffs are larger and slightly shaded underneath; upper puffs are bright and billowy
        const isBase = p < 3;
        const puffMat = isBase ? cloudShadeMat : cloudWhiteMat;

        let r = (9 + Math.sin(p * 2.1) * 3.5) * cfg.scale;
        let ox = (p - cfg.puffs / 2) * (14 * cfg.scale) + Math.sin(p * 3.4) * 5;
        let oz = Math.cos(p * 2.8) * (12 * cfg.scale);
        let oy = 0;

        if (cfg.type === 'tower') {
          // Towering build-up: central billows rise significantly higher
          const towerFactor = Math.sin(pt * Math.PI);
          oy = towerFactor * (16 * cfg.scale);
          r *= (0.8 + 0.4 * towerFactor);
        } else if (cfg.type === 'bank') {
          oy = (Math.sin(p * 1.5) - 0.2) * 4;
        } else {
          // Wispy: flatter, elongated
          r *= 0.75;
          oy = (Math.sin(p * 2.0)) * 2;
        }

        const puff = new THREE.Mesh(new THREE.DodecahedronGeometry(r, 1), puffMat);
        puff.position.set(ox, oy, oz);
        puff.rotation.set(p * 0.4, p * 0.7, p * 0.3);
        cloudGroup.add(puff);
      }

      cloudGroup.position.set(cfg.x, cfg.y, cfg.z);
      this.scene.add(cloudGroup);

      this.clouds.push({
        group: cloudGroup,
        speed: cfg.speed
      });
    });
  }

  /**
   * Valley terrain with raised homestead knoll terrace and natural curving country lane
   */
  buildMeadowAndTerrace() {
    const grassTex = createGrassTexture();
    grassTex.repeat.set(40, 40);
    const grassMat = new THREE.MeshStandardMaterial({
      map: grassTex,
      roughness: 0.85,
      metalness: 0.02
    });

    // 1. MAIN MEADOW FLOOR (160m x 160m)
    const groundGeom = new THREE.BoxGeometry(160, 2, 160);
    const groundMesh = new THREE.Mesh(groundGeom, grassMat);
    groundMesh.position.set(0, -1, 0);
    groundMesh.receiveShadow = true;
    this.scene.add(groundMesh);
    this.world.addBoxCollider(groundMesh);

    // 2. RAISED HOMESTEAD TERRACE KNOLL (+0.6m elevation)
    const terraceW = 28;
    const terraceD = 22;
    const terraceH = 0.6;
    const terraceZ = -34;

    // Fieldstone retaining wall
    const wallMesh = new THREE.Mesh(
      new THREE.BoxGeometry(terraceW + 0.6, terraceH, terraceD + 0.6),
      this.materials.stoneWall
    );
    wallMesh.position.set(0, terraceH / 2, terraceZ);
    wallMesh.castShadow = true;
    wallMesh.receiveShadow = true;
    this.scene.add(wallMesh);
    this.world.addBoxCollider(wallMesh);

    // Terrace grass top
    const terraceTopTex = createGrassTexture();
    terraceTopTex.repeat.set(8, 7);
    const terraceTop = new THREE.Mesh(
      new THREE.BoxGeometry(terraceW, 0.05, terraceD),
      new THREE.MeshStandardMaterial({ map: terraceTopTex, roughness: 0.85 })
    );
    terraceTop.position.set(0, terraceH + 0.025, terraceZ);
    terraceTop.receiveShadow = true;
    this.scene.add(terraceTop);

    // Stone terrace entrance steps (2 gentle steps)
    const stepMat = this.materials.stoneWall;
    const s1 = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.2, 0.8), stepMat);
    s1.position.set(0, 0.1, terraceZ + terraceD / 2 + 0.8);
    s1.receiveShadow = true;
    this.scene.add(s1);
    this.world.addBoxCollider(s1);

    const s2 = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.4, 0.8), stepMat);
    s2.position.set(0, 0.2, terraceZ + terraceD / 2 + 0.4);
    s2.receiveShadow = true;
    this.scene.add(s2);
    this.world.addBoxCollider(s2);

    // 3. CURVING COUNTRY LANE
    const pathTex = createPathTexture();
    pathTex.repeat.set(3, 24);
    const pathMat = new THREE.MeshStandardMaterial({ map: pathTex, roughness: 0.88 });

    // Main Avenue leading from spawn (0, 0) up to terrace steps (0, -22)
    const mainLane = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 50), pathMat);
    mainLane.rotateX(-Math.PI / 2);
    mainLane.position.set(0, 0.02, -8);
    mainLane.receiveShadow = true;
    this.scene.add(mainLane);

    // South Lane extension
    const southLane = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 38), pathMat);
    southLane.rotateX(-Math.PI / 2);
    southLane.position.set(0, 0.02, 24);
    southLane.receiveShadow = true;
    this.scene.add(southLane);

    // East Cross-Lane to Orchard
    const crossTex = createPathTexture();
    crossTex.repeat.set(16, 2.5);
    const crossMat = new THREE.MeshStandardMaterial({ map: crossTex, roughness: 0.88 });
    const eastLane = new THREE.Mesh(new THREE.PlaneGeometry(38, 3.8), crossMat);
    eastLane.rotateX(-Math.PI / 2);
    eastLane.position.set(18, 0.022, -8);
    eastLane.receiveShadow = true;
    this.scene.add(eastLane);

    // West Cross-Lane to Vegetable Garden & Stone Well
    const westLane = new THREE.Mesh(new THREE.PlaneGeometry(36, 3.8), crossMat);
    westLane.rotateX(-Math.PI / 2);
    westLane.position.set(-16, 0.022, -8);
    westLane.receiveShadow = true;
    this.scene.add(westLane);

    // Naturally embedded rustic flagstone edging along the main lane (Instanced)
    const cobbleMat = new THREE.MeshStandardMaterial({ color: 0x857d77, roughness: 0.92, flatShading: true });
    const cobbleGeo = new THREE.CylinderGeometry(0.38, 0.44, 0.05, 6);
    const zSteps = [];
    for (let z = -20; z <= 30; z += 1.8) zSteps.push(z);
    const instancedCobble = new THREE.InstancedMesh(cobbleGeo, cobbleMat, zSteps.length * 2);
    instancedCobble.receiveShadow = true;

    const dummyC = new THREE.Object3D();
    let cIdx = 0;
    for (const z of zSteps) {
      const scaleL = (0.32 + Math.sin(z) * 0.08) / 0.38;
      dummyC.position.set(-2.3 + Math.sin(z * 0.6) * 0.22, 0.025, z);
      dummyC.rotation.set(0, Math.sin(z) * Math.PI, 0);
      dummyC.scale.set(scaleL, 1, scaleL);
      dummyC.updateMatrix();
      instancedCobble.setMatrixAt(cIdx++, dummyC.matrix);

      const scaleR = (0.32 + Math.cos(z) * 0.08) / 0.38;
      dummyC.position.set(2.3 + Math.cos(z * 0.6) * 0.22, 0.025, z);
      dummyC.rotation.set(0, Math.cos(z) * Math.PI, 0);
      dummyC.scale.set(scaleR, 1, scaleR);
      dummyC.updateMatrix();
      instancedCobble.setMatrixAt(cIdx++, dummyC.matrix);
    }
    instancedCobble.instanceMatrix.needsUpdate = true;
    this.scene.add(instancedCobble);
  }

  /**
   * Sweeping Layered Alpine Mountain Massifs & Ridge Horizons
   * Built as broad, sweeping low-poly mountain ridges pushed back to realistic horizon distances (120m - 145m),
   * with natural saddles, shoulders, crisp faceted snowcaps, and green foothill skirts.
   * Completely eliminates steep pillar towers and pointy spikes!
   */
  buildLayeredMountainHorizon() {
    const rockFar = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.95, flatShading: true });
    const rockMid = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.9, flatShading: true });
    const snowMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.65, flatShading: true });
    const skirtMat = new THREE.MeshStandardMaterial({ color: 0x1e3a29, roughness: 0.9, flatShading: true });
    const foothillMat = new THREE.MeshStandardMaterial({ color: 0x2d5a3f, roughness: 0.9, flatShading: true });

    // Creates an authentic sweeping low-poly mountain ridge massif
    const createSweepingMountain = (x, z, radius, height, yaw, stretchX, stretchZ, mat, hasSnow = true) => {
      const group = new THREE.Group();
      group.position.set(x, 0, z);

      // Main broad faceted peak (6-7 sides for iconic low-poly alpine crags)
      const mainGeo = new THREE.ConeGeometry(radius, height, 7);
      mainGeo.scale(stretchX, 1.0, stretchZ);
      const mainMesh = new THREE.Mesh(mainGeo, mat);
      mainMesh.position.set(0, height / 2, 0);
      mainMesh.rotation.y = yaw;
      mainMesh.receiveShadow = true;
      group.add(mainMesh);

      // Overlapping secondary shoulder ridge
      const shoulderR = radius * 0.65;
      const shoulderH = height * 0.72;
      const shoulderGeo = new THREE.ConeGeometry(shoulderR, shoulderH, 6);
      shoulderGeo.scale(stretchX * 0.9, 1.0, stretchZ * 1.1);
      const shoulderMesh = new THREE.Mesh(shoulderGeo, mat);
      shoulderMesh.position.set(radius * 0.45 * Math.cos(yaw), shoulderH / 2, radius * 0.45 * Math.sin(yaw));
      shoulderMesh.rotation.y = yaw + 0.4;
      group.add(shoulderMesh);

      // Lower pine-skirted ridge base
      const skirtGeo = new THREE.ConeGeometry(radius * 0.55, height * 0.35, 6);
      const skirtMesh = new THREE.Mesh(skirtGeo, skirtMat);
      skirtMesh.position.set(-radius * 0.35 * Math.cos(yaw), height * 0.175, -radius * 0.35 * Math.sin(yaw));
      group.add(skirtMesh);

      // Crisp faceted snowcap on summit
      if (hasSnow && height >= 24) {
        const snowH = height * 0.34;
        const snowR = radius * 0.36;
        const snowGeo = new THREE.ConeGeometry(snowR, snowH, 7);
        snowGeo.scale(stretchX, 1.0, stretchZ);
        const snowMesh = new THREE.Mesh(snowGeo, snowMat);
        snowMesh.position.set(0, height - snowH / 2 + 0.1, 0);
        snowMesh.rotation.y = yaw;
        group.add(snowMesh);

        // Secondary shoulder snowcap
        const sSnowH = shoulderH * 0.28;
        const sSnowR = shoulderR * 0.32;
        const sSnowGeo = new THREE.ConeGeometry(sSnowR, sSnowH, 6);
        const sSnowMesh = new THREE.Mesh(sSnowGeo, snowMat);
        sSnowMesh.position.set(shoulderMesh.position.x, shoulderH - sSnowH / 2 + 0.1, shoulderMesh.position.z);
        sSnowMesh.rotation.y = yaw + 0.4;
        group.add(sSnowMesh);
      }

      this.scene.add(group);
    };

    // 1. DISTANT ALPINE RANGES (pushed back to 115m - 165m, framing the sky gracefully)
    // Refined color palette with atmospheric depth and high tonal separation
    const rockFarHigh = new THREE.MeshStandardMaterial({ color: 0x718096, roughness: 0.92, flatShading: true }); // Distant atmospheric slate
    const rockFarDeep = new THREE.MeshStandardMaterial({ color: 0x4a5568, roughness: 0.95, flatShading: true }); // Dramatic shadowed cliffs
    const rockNear    = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.88, flatShading: true }); // Rich near-range bedrock
    const ridgeAccent = new THREE.MeshStandardMaterial({ color: 0x2d3748, roughness: 0.90, flatShading: true }); // Sharp ridge precipices

    // North Range (magnificent panoramic alpine backdrop safely behind Farmhouse estate)
    const northMassifs = [
      { x: -95, z: -148, r: 60, h: 42, yaw: 0.35, sx: 1.45, sz: 0.85, mat: rockFarHigh },
      { x: -50, z: -158, r: 66, h: 48, yaw: 0.75, sx: 1.35, sz: 0.85, mat: rockFarDeep },
      { x: -5,  z: -164, r: 72, h: 52, yaw: 0.18, sx: 1.55, sz: 0.80, mat: rockFarHigh },
      { x: 44,  z: -155, r: 64, h: 46, yaw: 1.15, sx: 1.35, sz: 0.85, mat: rockFarDeep },
      { x: 92,  z: -148, r: 58, h: 40, yaw: 0.52, sx: 1.40, sz: 0.85, mat: rockFarHigh }
    ];
    northMassifs.forEach(m => createSweepingMountain(m.x, m.z, m.r, m.h, m.yaw, m.sx, m.sz, m.mat, true));

    // South Range
    const southMassifs = [
      { x: -92, z: 128, r: 58, h: 38, yaw: 0.42, sx: 1.42, sz: 0.92, mat: rockFarDeep },
      { x: -46, z: 138, r: 64, h: 44, yaw: 0.88, sx: 1.32, sz: 0.95, mat: rockFarHigh },
      { x: 6,   z: 144, r: 68, h: 48, yaw: 0.28, sx: 1.52, sz: 0.92, mat: rockFarDeep },
      { x: 52,  z: 136, r: 62, h: 42, yaw: 1.18, sx: 1.32, sz: 0.95, mat: rockFarHigh },
      { x: 94,  z: 126, r: 56, h: 36, yaw: 0.62, sx: 1.42, sz: 0.92, mat: rockFarDeep }
    ];
    southMassifs.forEach(m => createSweepingMountain(m.x, m.z, m.r, m.h, m.yaw, m.sx, m.sz, m.mat, true));

    // West Range
    const westMassifs = [
      { x: -130, z: -72, r: 56, h: 40, yaw: 1.52, sx: 0.92, sz: 1.42, mat: rockFarHigh },
      { x: -140, z: -22, r: 64, h: 45, yaw: 1.68, sx: 0.92, sz: 1.32, mat: rockFarDeep },
      { x: -140, z: 28,  r: 62, h: 43, yaw: 1.42, sx: 0.92, sz: 1.42, mat: rockFarHigh },
      { x: -128, z: 76,  r: 56, h: 38, yaw: 1.58, sx: 0.92, sz: 1.32, mat: rockFarDeep }
    ];
    westMassifs.forEach(m => createSweepingMountain(m.x, m.z, m.r, m.h, m.yaw, m.sx, m.sz, m.mat, true));

    // East Range
    const eastMassifs = [
      { x: 130, z: -72, r: 56, h: 40, yaw: 1.52, sx: 0.92, sz: 1.42, mat: rockFarHigh },
      { x: 140, z: -22, r: 64, h: 45, yaw: 1.68, sx: 0.92, sz: 1.32, mat: rockFarDeep },
      { x: 140, z: 28,  r: 62, h: 43, yaw: 1.42, sx: 0.92, sz: 1.42, mat: rockFarHigh },
      { x: 128, z: 76,  r: 56, h: 38, yaw: 1.58, sx: 0.92, sz: 1.32, mat: rockFarDeep }
    ];
    eastMassifs.forEach(m => createSweepingMountain(m.x, m.z, m.r, m.h, m.yaw, m.sx, m.sz, m.mat, true));

    // 2. MIDGROUND MOUNTAIN RIDGES & CRAGS (stronger light/shadow planes & cliff ridges)
    const midCrags = [
      { x: -64, z: -110, r: 40, h: 32, yaw: 0.42, sx: 1.25, sz: 0.82, mat: rockNear },
      { x: -24, z: -116, r: 42, h: 34, yaw: 0.82, sx: 1.25, sz: 0.82, mat: ridgeAccent },
      { x: 26,  z: -114, r: 42, h: 33, yaw: 0.22, sx: 1.25, sz: 0.82, mat: rockNear },
      { x: 66,  z: -108, r: 40, h: 31, yaw: 1.02, sx: 1.25, sz: 0.82, mat: ridgeAccent },
      { x: -90, z: -26,  r: 42, h: 28, yaw: 1.52, sx: 0.92, sz: 1.25, mat: rockNear },
      { x: -90, z: 36,   r: 42, h: 27, yaw: 1.62, sx: 0.92, sz: 1.25, mat: ridgeAccent },
      { x: 90,  z: -26,  r: 42, h: 28, yaw: 1.52, sx: 0.92, sz: 1.25, mat: rockNear },
      { x: 90,  z: 36,   r: 42, h: 27, yaw: 1.62, sx: 0.92, sz: 1.25, mat: ridgeAccent }
    ];
    midCrags.forEach(mc => createSweepingMountain(mc.x, mc.z, mc.r, mc.h, mc.yaw, mc.sx, mc.sz, mc.mat, false));

    // 3. ROLLING ALPINE FOOTHILLS WITH NATURAL SLOPE AND TRANSITION CLUSTERS
    // Matches Reference Board 2 (Grassy Foothills):
    // - Gentle green slope mounds
    // - Natural boulder and stone clusters at foothill skirt
    // - Wildflower patches softening meadow-to-mountain boundary
    const boulderMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.90, flatShading: true });
    const flowerYellowMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.65 });
    const flowerWhiteMat  = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.65 });

    for (let f = 0; f < 22; f++) {
      const angle = (f / 22) * Math.PI * 2;
      const isNorth = Math.sin(angle) < -0.15;
      const dist = isNorth ? 80 + (f % 2) * 5 : 65 + (f % 2) * 5;
      const fx = Math.cos(angle) * dist;
      const fz = Math.sin(angle) * dist;
      const fr = isNorth ? 20 + (f % 3) * 3 : 24 + (f % 3) * 3;
      const fh = 11 + (f % 2) * 3.5;

      const hillGeo = new THREE.ConeGeometry(fr, fh, 7);
      hillGeo.scale(1.15, 1.0, isNorth ? 0.78 : 0.88);
      const hillMesh = new THREE.Mesh(hillGeo, foothillMat);
      hillMesh.position.set(fx, fh / 2, fz);
      hillMesh.rotation.y = angle + 0.3;
      hillMesh.receiveShadow = true;
      this.scene.add(hillMesh);

      // Natural weathered boulder clusters at base of foothill
      if (f % 2 === 0) {
        const bGroup = new THREE.Group();
        const bDist = dist - fr * 0.45;
        bGroup.position.set(Math.cos(angle) * bDist, 0, Math.sin(angle) * bDist);

        for (let b = 0; b < 3; b++) {
          const bSize = 0.8 + (b * 0.4);
          const bMesh = new THREE.Mesh(new THREE.DodecahedronGeometry(bSize, 1), boulderMat);
          bMesh.scale.set(1.2, 0.75, 1.0);
          bMesh.position.set((b - 1) * 1.2, bSize * 0.4, (b % 2) * 0.6);
          bMesh.rotation.set(b * 0.5, b * 0.8, b * 0.3);
          bMesh.receiveShadow = true;
          bGroup.add(bMesh);
        }

        // Wildflower blossoms accenting boulder bases
        for (let fl = 0; fl < 4; fl++) {
          const flMat = (fl % 2 === 0) ? flowerYellowMat : flowerWhiteMat;
          const flMesh = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.32, 5), flMat);
          flMesh.position.set(Math.cos(fl * 1.5) * 1.8, 0.16, Math.sin(fl * 1.5) * 1.8);
          bGroup.add(flMesh);
        }

        this.scene.add(bGroup);
      }
    }

    // 4. IMPENETRABLE VALLEY PERIMETER BOUNDARY WALLS
    // Prevents player from climbing mountains, glitching into rocks, or leaving playable valley floor
    const barrierMat = new THREE.MeshBasicMaterial({ visible: false });

    // North Mountain Barrier Wall (at z=-44.5, front edge z=-42.5 safely behind trees and chalet)
    const northWall = new THREE.Mesh(new THREE.BoxGeometry(110, 30, 4), barrierMat);
    northWall.position.set(0, 15, -44.5);
    this.scene.add(northWall);
    this.world.addBoxCollider(northWall);

    // South Valley Meadow Barrier Wall (at z=48.0, front edge z=46.0 safely behind southern tree belt)
    const southWall = new THREE.Mesh(new THREE.BoxGeometry(110, 30, 4), barrierMat);
    southWall.position.set(0, 15, 48.0);
    this.scene.add(southWall);
    this.world.addBoxCollider(southWall);

    // West Ridge Barrier Wall (at x=-50.0, inner edge x=-48.0 behind apple orchard)
    const westWall = new THREE.Mesh(new THREE.BoxGeometry(4, 30, 105), barrierMat);
    westWall.position.set(-50.0, 15, 2.0);
    this.scene.add(westWall);
    this.world.addBoxCollider(westWall);

    // East Foothill Barrier Wall (at x=50.0, inner edge x=48.0 behind east paddocks & grove)
    const eastWall = new THREE.Mesh(new THREE.BoxGeometry(4, 30, 105), barrierMat);
    eastWall.position.set(50.0, 15, 2.0);
    this.scene.add(eastWall);
    this.world.addBoxCollider(eastWall);

    // 4 Diagonal Corner Wedges (sealing the perimeter completely)
    const cornerGeo = new THREE.BoxGeometry(26, 30, 10);

    const nwWedge = new THREE.Mesh(cornerGeo, barrierMat);
    nwWedge.position.set(-42, 15, -38);
    nwWedge.rotation.y = Math.PI / 4;
    this.scene.add(nwWedge);
    this.world.addBoxCollider(nwWedge);

    const neWedge = new THREE.Mesh(cornerGeo, barrierMat);
    neWedge.position.set(42, 15, -38);
    neWedge.rotation.y = -Math.PI / 4;
    this.scene.add(neWedge);
    this.world.addBoxCollider(neWedge);

    const swWedge = new THREE.Mesh(cornerGeo, barrierMat);
    swWedge.position.set(-42, 15, 42);
    swWedge.rotation.y = -Math.PI / 4;
    this.scene.add(swWedge);
    this.world.addBoxCollider(swWedge);

    const seWedge = new THREE.Mesh(cornerGeo, barrierMat);
    seWedge.position.set(42, 15, 42);
    seWedge.rotation.y = Math.PI / 4;
    this.scene.add(seWedge);
    this.world.addBoxCollider(seWedge);
  }

  /**
   * Premium Stylized Alpine Farmhouse (Milestone B Blender Reconstruction)
   * Loads public/models/farmhouse_exterior.glb via AssetPipeline
   * Features: Fieldstone plinth, half-timbering, cedar shingles, veranda porch,
   * recessed door, windows with flower boxes, stone chimney, woodshed, and -col proxies.
   */
  buildAlpineFarmhouse() {
    const houseX = 0;
    const terraceElevation = 0.6;
    const houseZ = -34;

    this.chimneySmokeOrigin = new THREE.Vector3(
      houseX + 5.2,
      terraceElevation + 7.6,
      houseZ - 1.2
    );

    // Warm hanging porch lantern light & ambient veranda fill
    const lLight = new THREE.PointLight(0xfef08a, 1.6, 10);
    lLight.position.set(houseX, terraceElevation + 2.4, houseZ + 5.95);
    this.lanternLight = lLight;
    this.scene.add(lLight);

    // Soft warm fill light for porch entrance, timber rails & doorway
    const porchFill = new THREE.PointLight(0xffedd5, 1.3, 8);
    porchFill.position.set(houseX, terraceElevation + 1.4, houseZ + 4.8);
    this.scene.add(porchFill);

    // Immediate interactive front door proxy so interactables array is immediately ready
    const doorProxyMesh = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 2.4, 0.4),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    doorProxyMesh.position.set(houseX, terraceElevation + 1.2, houseZ + 3.8);
    this.scene.add(doorProxyMesh);

    this.isFarmhouseDoorOpen = false;

    const doorInteractable = {
      id: 'house_front_door',
      mesh: doorProxyMesh,
      name: 'Alpine Farmhouse Front Door',
      prompt: 'Open Door & Enter Farmhouse',
      ready: true,
      interact: (player) => {
        sounds.playInteract();
        this.isFarmhouseDoorOpen = true;
        const fade = document.getElementById('screen-fade');
        if (fade) {
          fade.classList.add('active');
          setTimeout(() => {
            player.respawn(new THREE.Vector3(160, 1.2, 161.5));
            player.yaw = 0.0;
            player.pitch = 0.0;
            setTimeout(() => {
              fade.classList.remove('active');
              this.isFarmhouseDoorOpen = false;
            }, 300);
          }, 350);
        } else {
          player.respawn(new THREE.Vector3(160, 1.2, 161.5));
          player.yaw = 0.0;
          this.isFarmhouseDoorOpen = false;
        }
        window.dispatchEvent(new CustomEvent('game:message', { detail: { message: '🏡 Entered cozy Alpine Farmhouse' } }));
      }
    };
    this.interactables.push(doorInteractable);

    // Soft rising smoke puffs from stone chimney flue
    const smokeMat = new THREE.MeshLambertMaterial({
      color: 0xe2e8f0,
      transparent: true,
      opacity: 0.45,
      flatShading: true
    });
    for (let s = 0; s < 6; s++) {
      const puff = new THREE.Mesh(new THREE.DodecahedronGeometry(0.35 + s * 0.12, 1), smokeMat);
      puff.position.copy(this.chimneySmokeOrigin);
      puff.position.y += s * 0.8;
      this.scene.add(puff);
      this.smokeParticles.push({
        mesh: puff,
        baseY: this.chimneySmokeOrigin.y,
        offset: s * 1.2
      });
    }

    // Load handcrafted Blender Farmhouse Exterior GLB via AssetPipeline
    assetPipeline.loadModel('/models/farmhouse_exterior.glb', {
      castShadow: true,
      receiveShadow: true,
      collision: 'none' // explicit -col meshes exist
    }).then(({ model, colliders }) => {
      model.position.set(houseX, terraceElevation, houseZ);
      model.rotation.y = Math.PI;
      model.updateMatrixWorld(true);
      this.scene.add(model);
      this.farmhouseExteriorModel = model;

      // Register extracted collision proxies with rotation updated
      colliders.forEach(col => {
        col.box.setFromObject(col.mesh);
        this.world.colliders.push({ box: col.box, mesh: col.mesh, type: 'solid' });
      });

      // Register smooth stair ramp collider (seamless ascent/descent from ground Y=0.60 to porch deck Y=1.50)
      this.world.addRamp(-1.1, 1.1, -27.9, -26.2, 1.50, 0.60, 'z');

      // Bind door hinge pivot & door leaf
      const doorPivot = model.getObjectByName('door_pivot');
      if (doorPivot) {
        this.farmhouseDoorPivot = doorPivot;
      }
      const doorLeaf = model.getObjectByName('door_leaf');
      if (doorLeaf) {
        this.farmhouseDoorLeaf = doorLeaf;
        doorInteractable.mesh = doorLeaf;
      }

      // Update chimney smoke origin from model's empty node
      const smokeEmpty = model.getObjectByName('chimney_smoke_origin');
      if (smokeEmpty) {
        smokeEmpty.getWorldPosition(this.chimneySmokeOrigin);
      }
    }).catch(err => {
      console.warn('[World] Failed to load farmhouse_exterior.glb, using fallback proxy', err);
    });
  }

  /**
   * Fully Designed Cozy Alpine Farmhouse Interior (Milestone B Blender Reconstruction)
   * Loads public/models/farmhouse_interior.glb via AssetPipeline
   * Features: Cedar floorboards, timber beams, fieldstone hearth, quilted bed,
   * trestle dining table, kitchen shelves, storage chest, and full interactive mechanics.
   */
  buildFarmhouseInterior() {
    const originX = 160;
    const originZ = 160;
    const roomH = 3.6;

    this.isSleeping = false;
    this.isFireLit = true;
    this.chestItems = [
      { id: 'seed_carrot', name: 'Carrot Seeds', icon: '🌱', count: 4 },
      { id: 'seed_wheat', name: 'Wheat Seeds', icon: '🌱', count: 4 },
      { id: 'seed_pumpkin', name: 'Pumpkin Seeds', icon: '🌱', count: 2 },
      { id: 'seed_tomato', name: 'Tomato Seeds', icon: '🌱', count: 2 },
      { id: 'apple', name: 'Fresh Apple', icon: '🍎', count: 3 }
    ];

    // Solid floor beneath cedar floorboards (Y=0) - prevents falling through
    const floorBox = new THREE.Box3(
      new THREE.Vector3(originX - 6.0, -2.0, originZ - 6.0),
      new THREE.Vector3(originX + 6.0, 0.0, originZ + 6.0)
    );
    this.world.colliders.push({ box: floorBox, type: 'solid' });

    // Perimeter boundary walls for interior room
    const wallColliders = [
      new THREE.Box3(new THREE.Vector3(originX - 5.5, 0, originZ - 4.5), new THREE.Vector3(originX + 5.5, roomH, originZ - 3.5)), // North
      new THREE.Box3(new THREE.Vector3(originX - 5.5, 0, originZ + 3.5), new THREE.Vector3(originX + 5.5, roomH, originZ + 4.5)), // South
      new THREE.Box3(new THREE.Vector3(originX - 5.5, 0, originZ - 4.5), new THREE.Vector3(originX - 4.7, roomH, originZ + 4.5)), // West
      new THREE.Box3(new THREE.Vector3(originX + 4.7, 0, originZ - 4.5), new THREE.Vector3(originX + 5.5, roomH, originZ + 4.5)), // East
      // Bed and Table obstacle hitboxes
      new THREE.Box3(new THREE.Vector3(originX - 4.5, 0, originZ - 3.5), new THREE.Vector3(originX - 1.8, 1.2, originZ - 0.8)), // Bed
      new THREE.Box3(new THREE.Vector3(originX + 1.8, 0, originZ - 2.0), new THREE.Vector3(originX + 4.2, 0.9, originZ + 0.6))  // Table
    ];
    wallColliders.forEach(box => {
      this.world.colliders.push({ box, type: 'solid' });
    });

    // Warm Hearth Point Light (centered at stone fireplace)
    const hearthLight = new THREE.PointLight(0xff7a18, 2.8, 14, 1.5);
    hearthLight.position.set(originX, 1.1, originZ - 2.8);
    hearthLight.castShadow = false;
    this.hearthLight = hearthLight;
    this.scene.add(hearthLight);

    // Warm Ambient Table Lamp
    const tableLamp = new THREE.PointLight(0xfef08a, 1.2, 8, 1.2);
    tableLamp.position.set(originX - 3.2, 1.6, originZ - 0.6);
    this.scene.add(tableLamp);

    // Initial interactables stubs for immediate availability
    const exitDoorProxy = new THREE.Mesh(new THREE.BoxGeometry(1.4, 2.4, 0.4), new THREE.MeshBasicMaterial({ visible: false }));
    exitDoorProxy.position.set(originX, 1.2, originZ + 3.5);
    this.scene.add(exitDoorProxy);

    const bedProxy = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.8, 2.4), new THREE.MeshBasicMaterial({ visible: false }));
    bedProxy.position.set(originX - 3.1, 0.4, originZ - 2.1);
    this.scene.add(bedProxy);

    const hearthProxy = new THREE.Mesh(new THREE.BoxGeometry(2.6, 2.0, 1.2), new THREE.MeshBasicMaterial({ visible: false }));
    hearthProxy.position.set(originX, 1.0, originZ - 2.8);
    this.scene.add(hearthProxy);

    const chestProxy = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.7, 0.7), new THREE.MeshBasicMaterial({ visible: false }));
    chestProxy.position.set(originX + 1.8, 0.35, originZ + 2.7);
    this.scene.add(chestProxy);

    // 1. Exit Door Interactable
    const exitDoorInteractable = {
      id: 'house_exit_door',
      mesh: exitDoorProxy,
      name: 'Front Door',
      prompt: 'Leave Farmhouse',
      ready: true,
      interact: (player) => {
        sounds.playInteract();
        const fade = document.getElementById('screen-fade');
        if (fade) {
          fade.classList.add('active');
          setTimeout(() => {
            player.respawn(new THREE.Vector3(0, 1.55, -28.2));
            player.yaw = 0.0;
            player.pitch = 0.0;
            setTimeout(() => { fade.classList.remove('active'); }, 250);
          }, 300);
        } else {
          player.respawn(new THREE.Vector3(0, 1.55, -28.2));
          player.yaw = 0.0;
        }
        window.dispatchEvent(new CustomEvent('game:message', { detail: { message: '☀️ Left Farmhouse, stepped onto veranda' } }));
      }
    };
    this.interactables.push(exitDoorInteractable);

    // 2. Bed Sleep Interactable (Safeguarded: no duplicate rollover)
    const bedInteractable = {
      id: 'house_bed',
      mesh: bedProxy,
      name: 'Quilted Bed',
      prompt: 'Sleep until Morning (06:00)',
      ready: true,
      interact: (player) => {
        if (this.isSleeping) return;
        this.isSleeping = true;
        sounds.playInteract();

        const fade = document.getElementById('screen-fade');
        if (fade) fade.classList.add('active');

        setTimeout(() => {
          const tm = this.timeManager || window.timeManager;
          if (tm) {
            tm.sleepUntilMorning(6);
          }
          player.stamina = 100;
          player.isExhausted = false;
          player.respawn(new THREE.Vector3(originX - 1.6, 1.2, originZ - 2.1));
          player.yaw = Math.PI / 2;

          setTimeout(() => {
            if (fade) fade.classList.remove('active');
            this.isSleeping = false;
            const dayNum = tm ? tm.day : 1;
            window.dispatchEvent(new CustomEvent('game:message', {
              detail: { message: `☀️ Slept peacefully until sunrise (Day ${dayNum}). Stamina restored to 100%!` }
            }));
          }, 300);
        }, 500);
      }
    };
    this.interactables.push(bedInteractable);

    // 3. Fireplace Light Toggle Interactable
    const fireplaceInteractable = {
      id: 'house_fireplace',
      mesh: hearthProxy,
      name: 'Stone Fireplace',
      prompt: 'Extinguish Fireplace',
      ready: true,
      interact: (player) => {
        this.isFireLit = !this.isFireLit;
        if (this.hearthLight) {
          this.hearthLight.visible = this.isFireLit;
        }
        sounds.playInteract();
        fireplaceInteractable.prompt = this.isFireLit ? 'Extinguish Fireplace' : 'Light Fireplace';
        const msg = this.isFireLit
          ? '🔥 Lit the fireplace — cozy warmth fills the cabin'
          : '💨 Extinguished the fireplace';
        window.dispatchEvent(new CustomEvent('game:message', { detail: { message: msg } }));
      }
    };
    this.interactables.push(fireplaceInteractable);

    // 4. Storage Chest Interactable
    const chestInteractable = {
      id: 'house_chest',
      mesh: chestProxy,
      name: 'Storage Chest',
      prompt: 'Open Storage Chest',
      ready: true,
      interact: (player) => {
        if (this.interiorChestLid) {
          this.interiorChestLid.rotation.x = -Math.PI / 3;
        }
        sounds.playInteract();
        window.dispatchEvent(new CustomEvent('storage:open', { detail: { chest: this.chestItems } }));
      }
    };
    this.interactables.push(chestInteractable);

    // Load handcrafted Blender Farmhouse Interior GLB via AssetPipeline
    assetPipeline.loadModel('/models/farmhouse_interior.glb', {
      castShadow: true,
      receiveShadow: true,
      collision: 'none'
    }).then(({ model, colliders }) => {
      model.position.set(originX, 0, originZ);
      model.rotation.y = Math.PI;
      model.updateMatrixWorld(true);
      this.scene.add(model);
      this.farmhouseInteriorModel = model;

      // Register extracted collision proxies with rotation updated
      colliders.forEach(col => {
        col.box.setFromObject(col.mesh);
        this.world.colliders.push({ box: col.box, mesh: col.mesh, type: 'solid' });
      });

      // Bind node meshes to interactables
      const exitLeaf = model.getObjectByName('exit_door_leaf');
      if (exitLeaf) exitDoorInteractable.mesh = exitLeaf;

      const bedNode = model.getObjectByName('bed_sleep_node') || model.getObjectByName('Bed_Quilt');
      if (bedNode) bedInteractable.mesh = bedNode;

      const hearthNode = model.getObjectByName('hearth_light_anchor') || model.getObjectByName('Fireplace_Logs');
      if (hearthNode) fireplaceInteractable.mesh = hearthNode;

      const chestBody = model.getObjectByName('chest_body');
      if (chestBody) chestInteractable.mesh = chestBody;

      const chestLid = model.getObjectByName('chest_lid');
      if (chestLid) this.interiorChestLid = chestLid;
    }).catch(err => {
      console.warn('[World] Failed to load farmhouse_interior.glb, using fallback proxy', err);
    });
  }

  restoreHouseState(data) {
    if (!data) return;
    if (typeof data.fireLit === 'boolean') {
      this.isFireLit = data.fireLit;
      if (this.hearthLight) this.hearthLight.visible = this.isFireLit;
      const fp = this.interactables.find(i => i.id === 'house_fireplace');
      if (fp) fp.prompt = this.isFireLit ? 'Extinguish Fireplace' : 'Light Fireplace';
    }
    if (Array.isArray(data.chest)) {
      this.chestItems = data.chest;
    }
  }

  /**
   * Enclosed agricultural crop paddocks with split-rail fences and plot signposts
   */
  buildCropFields() {
    const soilTex = createSoilTexture();
    soilTex.repeat.set(4, 3);
    const soilMat = new THREE.MeshStandardMaterial({ map: soilTex, roughness: 0.95 });
    const woodMat = this.materials.wood;
    const logMat = this.materials.timberLog;

    const buildPaddock = (x, z, w, d, title, icon) => {
      const paddockGroup = new THREE.Group();
      paddockGroup.position.set(x, 0, z);

      // Plot Signpost
      const signPost = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 1.3, 6), logMat);
      signPost.position.set(1.8, 0.65, d / 2 + 0.4);
      paddockGroup.add(signPost);

      const signBoard = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.35, 0.08), woodMat);
      signBoard.position.set(1.8, 1.1, d / 2 + 0.4);
      paddockGroup.add(signBoard);

      this.scene.add(paddockGroup);

      // Asynchronously instantiate 3D Handcrafted Blender Modular Fence Segments
      // North fence (14m span = 4.8 segments scaled), East & West fences, and South fence with walking gate opening
      assetPipeline.loadModel('/models/fence_segment.glb', { collision: 'none' }).then(res => {
        if (!res || !res.model) return;
        const masterFence = res.model;

        // North boundary (3 segments along X)
        for (let seg = -1; seg <= 1; seg++) {
          const m = masterFence.clone(true);
          m.position.set(seg * 2.9, 0, -d / 2);
          m.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } });
          paddockGroup.add(m);
        }

        // South boundary (2 segments leaving central 2.4m gate opening)
        [-1, 1].forEach(side => {
          const m = masterFence.clone(true);
          m.position.set(side * 4.2, 0, d / 2);
          m.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } });
          paddockGroup.add(m);
        });

        // West boundary (2 segments rotated 90 degrees)
        for (let seg = -0.5; seg <= 0.5; seg += 1) {
          const m = masterFence.clone(true);
          m.position.set(-w / 2, 0, seg * 2.9);
          m.rotation.y = Math.PI / 2;
          m.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } });
          paddockGroup.add(m);
        }

        // East boundary (2 segments rotated 90 degrees)
        for (let seg = -0.5; seg <= 0.5; seg += 1) {
          const m = masterFence.clone(true);
          m.position.set(w / 2, 0, seg * 2.9);
          m.rotation.y = Math.PI / 2;
          m.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } });
          paddockGroup.add(m);
        }
      }).catch(err => {
        console.warn('⚠️ [World] Failed to load fence_segment.glb:', err);
      });
    };

    // 1. WEST CARROT FIELD at (-16, -14)
    buildPaddock(-16, -14, 14, 10, 'Carrot Patch', '🥕');

    // 2. EAST PUMPKIN FIELD at (16, -14)
    buildPaddock(16, -14, 14, 10, 'Pumpkin Patch', '🎃');

    // 3. SOUTH-WEST GOLDEN WHEAT at (-16, 16)
    buildPaddock(-16, 16, 14, 10, 'Golden Wheat', '🌾');
    this.createScarecrow(-16, 16);

    // 4. SOUTH-EAST VEGETABLE GARDEN at (16, 16)
    buildPaddock(16, 16, 14, 10, 'Kitchen Garden', '🥕');
  }

  createScarecrow(x, z) {
    const scGroup = new THREE.Group();
    scGroup.position.set(x, 0, z);

    const logMat = this.materials.timberLog;
    const twineMat = this.materials.strawTwine;
    const strawMat = this.materials.straw;
    const flannelMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.85 }); // rustic red flannel
    const denimMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.9 }); // blue denim
    const burlapMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.95 }); // rustic burlap
    const buttonMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 }); // dark button eyes
    const hatMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.85 }); // weathered straw hat
    const sunflowerMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.5 }); // sunflower petals

    // 1. Weathered Post & Crossbeam with Notched Joint & Twine Lashings
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.10, 2.9, 8), logMat);
    post.position.set(0, 1.45, 0);
    post.rotation.z = 0.04;
    post.castShadow = true;
    scGroup.add(post);

    const crossbeam = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.2, 8), logMat);
    crossbeam.rotation.z = Math.PI / 2;
    crossbeam.position.set(0, 2.05, 0);
    crossbeam.castShadow = true;
    scGroup.add(crossbeam);

    // Crossed rope lashings at notch joint
    const lashing = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.03, 6, 12), twineMat);
    lashing.position.set(0, 2.05, 0);
    scGroup.add(lashing);

    // 2. Denim Dungarees / Rustic Trousers with Knee Patches
    const pantL = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.12, 1.0, 8), denimMat);
    pantL.position.set(-0.16, 0.95, 0);
    pantL.castShadow = true;
    scGroup.add(pantL);

    const pantR = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.12, 1.0, 8), denimMat);
    pantR.position.set(0.16, 0.95, 0);
    pantR.castShadow = true;
    scGroup.add(pantR);

    // Stitched knee patch
    const patch = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.14, 0.04), burlapMat);
    patch.position.set(-0.16, 0.9, 0.11);
    scGroup.add(patch);

    // Straw poking out of pant bottoms
    for (let s = 0; s < 4; s++) {
      const tuftL = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.22, 5), strawMat);
      tuftL.position.set(-0.16 + (s - 1.5) * 0.06, 0.4, 0);
      tuftL.rotation.z = (s - 1.5) * 0.2;
      scGroup.add(tuftL);

      const tuftR = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.22, 5), strawMat);
      tuftR.position.set(0.16 + (s - 1.5) * 0.06, 0.4, 0);
      tuftR.rotation.z = (s - 1.5) * 0.2;
      scGroup.add(tuftR);
    }

    // 3. Patchwork Flannel Shirt
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.85, 0.42), flannelMat);
    torso.position.set(0, 1.82, 0);
    torso.castShadow = true;
    scGroup.add(torso);

    // Flannel sleeves along crossbeam
    const sleeveL = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.10, 0.75, 8), flannelMat);
    sleeveL.rotation.z = Math.PI / 2;
    sleeveL.position.set(-0.65, 2.05, 0);
    sleeveL.castShadow = true;
    scGroup.add(sleeveL);

    const sleeveR = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.10, 0.75, 8), flannelMat);
    sleeveR.rotation.z = Math.PI / 2;
    sleeveR.position.set(0.65, 2.05, 0);
    sleeveR.castShadow = true;
    scGroup.add(sleeveR);

    // Straw tufts spilling from cuffs
    for (let s = 0; s < 3; s++) {
      const tuftArmL = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.28, 5), strawMat);
      tuftArmL.position.set(-1.05, 2.05 + (s - 1) * 0.05, 0);
      tuftArmL.rotation.z = Math.PI / 2 + (s - 1) * 0.25;
      scGroup.add(tuftArmL);

      const tuftArmR = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.28, 5), strawMat);
      tuftArmR.position.set(1.05, 2.05 + (s - 1) * 0.05, 0);
      tuftArmR.rotation.z = -Math.PI / 2 + (s - 1) * 0.25;
      scGroup.add(tuftArmR);
    }

    // Straw collar tufts
    for (let c = 0; c < 4; c++) {
      const collarTuft = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.18, 5), strawMat);
      const ang = (c / 4) * Math.PI * 2;
      collarTuft.position.set(Math.cos(ang) * 0.15, 2.26, Math.sin(ang) * 0.15);
      collarTuft.rotation.z = Math.cos(ang) * 0.4;
      collarTuft.rotation.x = Math.sin(ang) * 0.4;
      scGroup.add(collarTuft);
    }

    // 4. Burlap Sack Head with Button Eyes and Stitched Grin
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 10), burlapMat);
    head.scale.set(1.0, 1.15, 1.0);
    head.position.set(0, 2.52, 0);
    head.castShadow = true;
    scGroup.add(head);

    // Neck tie string
    const neckTie = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.025, 6, 12), twineMat);
    neckTie.rotation.x = Math.PI / 2;
    neckTie.position.set(0, 2.26, 0);
    scGroup.add(neckTie);

    // Dark button eyes
    const eyeGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.03, 8);
    const eyeL = new THREE.Mesh(eyeGeo, buttonMat);
    eyeL.rotation.x = Math.PI / 2;
    eyeL.position.set(-0.10, 2.56, 0.26);
    scGroup.add(eyeL);

    const eyeR = new THREE.Mesh(eyeGeo, buttonMat);
    eyeR.rotation.x = Math.PI / 2;
    eyeR.position.set(0.10, 2.56, 0.26);
    scGroup.add(eyeR);

    // Stitched smile
    const smile = new THREE.Mesh(new THREE.TorusGeometry(0.10, 0.015, 4, 8, Math.PI * 0.8), twineMat);
    smile.rotation.x = 0.2;
    smile.rotation.z = Math.PI;
    smile.position.set(0, 2.42, 0.26);
    scGroup.add(smile);

    // 5. Floppy Straw Hat with Sunflower
    const hatBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.56, 0.56, 0.04, 12), hatMat);
    hatBrim.position.set(0, 2.72, 0);
    hatBrim.rotation.z = 0.12;
    hatBrim.rotation.x = -0.06;
    scGroup.add(hatBrim);

    const hatCrown = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.32, 0.38, 10), hatMat);
    hatCrown.position.set(0.04, 2.92, -0.02);
    hatCrown.rotation.z = 0.16;
    hatCrown.castShadow = true;
    scGroup.add(hatCrown);

    // Sunflower on hat band
    const flower = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.03, 10), sunflowerMat);
    flower.rotation.x = Math.PI / 2;
    flower.position.set(-0.16, 2.80, 0.24);
    scGroup.add(flower);

    const flowerCenter = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.04, 8), buttonMat);
    flowerCenter.rotation.x = Math.PI / 2;
    flowerCenter.position.set(-0.16, 2.80, 0.26);
    scGroup.add(flowerCenter);

    this.scene.add(scGroup);
  }

  createCarrotCrop(centerX, centerZ, width, depth, prefix = 'carrot') {}
  createPumpkinCrop(centerX, centerZ, width, depth) {}
  createWheatCrop(centerX, centerZ, width, depth) {}

  /**
   * Smooth Stylized Trees: Characterful Branching Apple Trees,
   * Birch Copses, and Tiered Alpine Pines (Smooth organic geometry with accurate hitboxes)
   */
  buildFacetedTrees() {
    const trunkMat = this.materials.trunk;

    // 1. BLENDER STYLIZED APPLE ORCHARD & HERITAGE GROVE (12 Trees)
    // Upgraded from procedural spheres to high-fidelity Blender 3D models with branch-anchored fruit development
    const orchardLocations = [
      // East Orchard Rows (along East Orchard Lane)
      { x: 19.5, z: -17.8, h: 3.4, rot: 0.2 },
      { x: 25.8, z: -16.5, h: 3.6, rot: 1.1 },
      { x: 32.2, z: -17.2, h: 3.3, rot: -0.7 },
      { x: 20.2, z: -6.2,  h: 3.5, rot: 0.8 },
      { x: 26.5, z: -5.0,  h: 3.7, rot: -1.3 },
      { x: 33.0, z: -6.5,  h: 3.4, rot: 0.4 },
      { x: 19.8, z: 6.8,   h: 3.6, rot: -0.5 },
      { x: 26.2, z: 5.5,   h: 3.5, rot: 1.4 },
      { x: 32.5, z: 6.2,   h: 3.3, rot: -1.0 },
      // West Meadow Heritage Fruit Trees (framing Kitchen Garden & Knoll)
      { x: -27.5, z: -15.5, h: 3.5, rot: 0.6 },
      { x: -28.8, z: -4.2,  h: 3.7, rot: -0.9 },
      { x: -28.0, z: 8.5,   h: 3.4, rot: 1.2 }
    ];

    const pseudoRand = (seed) => {
      const s = Math.sin(seed) * 10000;
      return s - Math.floor(s);
    };

    // Synchronously initialize all 12 tree groups, colliders, and interactables
    orchardLocations.forEach((loc, tIndex) => {
      const treeGroup = new THREE.Group();
      treeGroup.position.set(loc.x, 0, loc.z);
      
      // Controlled procedural yaw rotation
      const yawVar = (loc.rot || 0) + (pseudoRand(tIndex * 31.7 + 5.2) - 0.5) * 0.6;
      treeGroup.rotation.y = yawVar;
      this.scene.add(treeGroup);

      // Controlled procedural scale variation (0.90 - 1.12)
      const scaleVar = 0.90 + pseudoRand(tIndex * 19.3 + 1.7) * 0.22;
      const trunkH = (loc.h || 3.4) * scaleVar;
      const trunkRadius = 0.44 * scaleVar;

      // Solid collision cylinder matching scaled tree base
      this.world.addCylinderCollider(loc.x, loc.z, trunkRadius, trunkH);
      const trunkBox = new THREE.Box3(
        new THREE.Vector3(loc.x - trunkRadius, 0, loc.z - trunkRadius),
        new THREE.Vector3(loc.x + trunkRadius, trunkH, loc.z + trunkRadius)
      );
      this.world.colliders.push({ box: trunkBox, mesh: treeGroup, type: 'solid', isCylinder: true });

      // 4 branch-anchored apple interactables per tree (total 48 fruit interactables)
      const fruits = [];
      for (let fIndex = 0; fIndex < 4; fIndex++) {
        const fruitObj = {
          id: `apple_tree_${tIndex}_fruit_${fIndex}`,
          mesh: null,
          name: `Apple Tree #${tIndex + 1}`,
          prompt: 'Pick Apple',
          ready: true,
          growTimer: 0,
          regrowTime: 15.0,
          pluckTimer: 0,
          baseY: 2.0 * scaleVar,
          interact: (player) => {
            if (!fruitObj.ready) return;
            fruitObj.ready = false;
            fruitObj.growTimer = fruitObj.regrowTime;
            fruitObj.pluckTimer = 0.2; // 200ms harvest pluck
            if (fruitObj.mesh) {
              fruitObj.mesh.scale.set(0.05, 0.05, 0.05);
            }

            player.addToBackpack('apple', 1);
            sounds.playInteract();

            events.emit('crop:harvested', { type: 'apple', id: fruitObj.id });

            const evt = new CustomEvent('game:message', {
              detail: { message: '🍎 Picked 1 Crisp Orchard Apple!' }
            });
            window.dispatchEvent(evt);
          },
          update: (dt) => {
            if (!fruitObj.ready) {
              fruitObj.growTimer -= dt;

              if (fruitObj.pluckTimer > 0) {
                fruitObj.pluckTimer -= dt;
                const pluckProgress = Math.max(0, fruitObj.pluckTimer / 0.2);
                const pluckScale = pluckProgress * 0.05;
                if (fruitObj.mesh) {
                  if (pluckScale <= 0.005) {
                    fruitObj.mesh.visible = false;
                  } else {
                    fruitObj.mesh.visible = true;
                    fruitObj.mesh.scale.set(pluckScale, pluckScale, pluckScale);
                  }
                }
              } else {
                const progress = 1 - (fruitObj.growTimer / fruitObj.regrowTime);
                if (progress <= 0.04) {
                  // Clean harvested state: no detached stem floating in air
                  if (fruitObj.mesh) fruitObj.mesh.visible = false;
                } else {
                  // Branch-anchored regrowth: smoothly expands outward from branch spur
                  const smoothP = progress * progress * (3 - 2 * progress);
                  const budScale = 0.08;
                  const currentScale = Math.min(1.0, budScale + smoothP * (1.0 - budScale));
                  if (fruitObj.mesh) {
                    fruitObj.mesh.visible = true;
                    fruitObj.mesh.scale.set(currentScale, currentScale, currentScale);
                  }
                }
              }

              if (fruitObj.growTimer <= 0) {
                fruitObj.ready = true;
                fruitObj.growTimer = 0;
                fruitObj.pluckTimer = 0;
                if (fruitObj.mesh) {
                  fruitObj.mesh.visible = true;
                  fruitObj.mesh.scale.set(1, 1, 1);
                }
              }
            }
          }
        };
        fruits.push(fruitObj);
        this.interactables.push(fruitObj);
      }

      this.fruitTrees.push({
        group: treeGroup,
        canopy: null,
        fruits,
        scaleVar,
        phaseOffset: loc.x * 0.5 + loc.z * 0.5
      });
    });

    // Single-pass GLTF loader: load master model once and clone across all 12 trees
    const gltfLoader = new GLTFLoader();
    gltfLoader.load('/models/apple_tree.glb', (gltf) => {
      // Configure shadow properties on base meshes
      gltf.scene.traverse(child => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      // Extract foliage materials to build subtle shared tone palettes
      const baseLeafMats = {};
      gltf.scene.traverse(child => {
        if (child.isMesh && child.material && child.material.name.startsWith('Mat_Leaf')) {
          baseLeafMats[child.material.name] = child.material;
        }
      });

      const createTintedPalette = (hShift, sShift, lShift) => {
        const pal = {};
        for (const [name, mat] of Object.entries(baseLeafMats)) {
          const m = mat.clone();
          m.color = mat.color.clone().offsetHSL(hShift, sShift, lShift);
          pal[name] = m;
        }
        return pal;
      };

      const foliagePalettes = [
        baseLeafMats,                             // Palette 0: Natural lush orchard green
        createTintedPalette(0.012, 0.04, 0.015),  // Palette 1: Sun-kissed golden green
        createTintedPalette(-0.018, 0.03, -0.01), // Palette 2: Deep alpine emerald
        createTintedPalette(0.008, 0.05, 0.008)   // Palette 3: Fresh spring lime
      ];

      // Attach cloned Blender model to all 12 orchard tree groups
      this.fruitTrees.forEach((treeData, tIdx) => {
        if (tIdx >= orchardLocations.length) return;

        const treeModel = gltf.scene.clone(true);
        treeModel.scale.set(treeData.scaleVar, treeData.scaleVar, treeData.scaleVar);

        // Assign foliage palette for organic orchard color diversity
        const chosenPalette = foliagePalettes[tIdx % 4];
        const canopyNode = treeModel.getObjectByName('Canopy');
        if (canopyNode) {
          treeData.canopy = canopyNode;
          canopyNode.children.forEach((cluster, cIdx) => {
            // Procedural canopy cluster micro-variations for unique tree silhouettes
            const cScale = 0.92 + pseudoRand(tIdx * 29 + cIdx * 7.3) * 0.16;
            cluster.scale.set(cScale, cScale, cScale);
            cluster.position.x += (pseudoRand(tIdx * 13 + cIdx * 5.1) - 0.5) * 0.10;
            cluster.position.z += (pseudoRand(tIdx * 17 + cIdx * 3.7) - 0.5) * 0.10;
          });
        }

        treeModel.traverse(child => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            if (child.material && chosenPalette[child.material.name]) {
              child.material = chosenPalette[child.material.name];
            }
          }
        });

        // Link apple nodes for interactive picking and branch-anchored regrowth
        for (let fIndex = 0; fIndex < 4; fIndex++) {
          const appleNode = treeModel.getObjectByName(`Apple_${fIndex}`);
          if (appleNode) {
            treeData.fruits[fIndex].mesh = appleNode;
            if (!treeData.fruits[fIndex].ready) {
              const progress = 1 - (treeData.fruits[fIndex].growTimer / treeData.fruits[fIndex].regrowTime);
              if (progress <= 0.04) {
                appleNode.visible = false;
              } else {
                const smoothP = progress * progress * (3 - 2 * progress);
                const budScale = 0.08;
                const currentScale = Math.min(1.0, budScale + smoothP * (1.0 - budScale));
                appleNode.visible = true;
                appleNode.scale.set(currentScale, currentScale, currentScale);
              }
            } else {
              appleNode.visible = true;
              appleNode.scale.set(1, 1, 1);
            }
          }
        }

        treeData.group.add(treeModel);
      });
    });


    // 2. HANDCRAFTED BLENDER SLENDER BIRCH TREES
    // Picturesque natural copses with sweeping trunks, lenticels, and weeping foliage
    const birchLocations = [
      // Terrace hillside copses (framing chalet knoll)
      { x: -16.5, z: -26.0, scale: 1.05 },
      { x: 16.5,  z: -26.0, scale: 1.05 },
      { x: -14.0, z: -35.0, scale: 0.95 },
      { x: 14.0,  z: -35.0, scale: 0.95 },
      // Shaded copse near stone well plaza (clear of well radius 2.6m and road)
      { x: -22.5, z: -3.0,  scale: 1.00 },
      { x: -24.0, z: 2.0,   scale: 0.95 },
      // Meadow groves (framing vistas)
      { x: -18.5, z: 27.0,  scale: 1.00 },
      { x: 18.5,  z: 27.0,  scale: 1.00 },
      { x: 36.0,  z: -22.0, scale: 1.05 },
      { x: 36.0,  z: 14.0,  scale: 0.95 }
    ];

    birchLocations.forEach((bl, bIdx) => {
      const bGroup = new THREE.Group();
      bGroup.position.set(bl.x, 0, bl.z);
      const rotY = (pseudoRand(bIdx * 37.1 + 8.4) - 0.5) * Math.PI * 2;
      bGroup.rotation.y = rotY;
      this.scene.add(bGroup);

      const bTrunkH = 5.8 * bl.scale;
      const bRadius = 0.28 * bl.scale;

      // Solid collision cylinder matching birch base
      this.world.addCylinderCollider(bl.x, bl.z, bRadius, bTrunkH);
      const bBox = new THREE.Box3(
        new THREE.Vector3(bl.x - bRadius, 0, bl.z - bRadius),
        new THREE.Vector3(bl.x + bRadius, bTrunkH, bl.z + bRadius)
      );
      this.world.colliders.push({ box: bBox, mesh: bGroup, type: 'solid', isCylinder: true });

      // Asynchronously instantiate Blender Birch model
      assetPipeline.loadModel('/models/tree_birch.glb', { collision: 'none' }).then(res => {
        if (res && res.model) {
          const m = res.model.clone(true);
          m.scale.set(bl.scale, bl.scale, bl.scale);
          m.traverse(c => {
            if (c.isMesh) {
              c.castShadow = true;
              c.receiveShadow = true;
            }
          });
          bGroup.add(m);
        }
      }).catch(err => {
        console.warn('⚠️ [World] Failed to load tree_birch.glb:', err);
      });
    });

    // 3. HANDCRAFTED BLENDER TIERED ALPINE SPRUCE TREES
    // Dense, layered evergreen forest belt naturally framing valley perimeter
    const spruceLocations = [
      // North Mountain Forest Belt (Behind & flanking farmhouse knoll with safe breathing room)
      { x: -32.0, z: -41.0, scale: 1.05 },
      { x: -25.0, z: -41.5, scale: 1.10 },
      { x: -18.0, z: -42.0, scale: 0.95 },
      { x: 0.0,   z: -42.5, scale: 1.15 },
      { x: 18.0,  z: -42.0, scale: 0.95 },
      { x: 25.0,  z: -41.5, scale: 1.10 },
      { x: 32.0,  z: -41.0, scale: 1.05 },

      // East Foothill Forest (flanking east valley ridge)
      { x: 44.0, z: -32.0, scale: 1.00 },
      { x: 45.0, z: -24.0, scale: 1.10 },
      { x: 44.0, z: -14.0, scale: 0.95 },
      { x: 45.0, z: 0.0,   scale: 1.05 },
      { x: 44.0, z: 12.0,  scale: 0.90 },
      { x: 45.0, z: 24.0,  scale: 1.05 },
      { x: 44.0, z: 35.0,  scale: 1.00 },

      // South Valley Entrance Woodlands (framing south meadow approach)
      { x: -32.0, z: 43.5, scale: 1.05 },
      { x: -24.0, z: 44.0, scale: 1.10 },
      { x: -15.0, z: 43.5, scale: 0.95 },
      { x: 15.0,  z: 43.5, scale: 0.95 },
      { x: 24.0,  z: 44.0, scale: 1.10 },
      { x: 32.0,  z: 43.5, scale: 1.05 },

      // West Ridge Forest (flanking west ridge)
      { x: -44.0, z: -30.0, scale: 1.00 },
      { x: -45.0, z: -20.0, scale: 1.05 },
      { x: -44.0, z: -8.0,  scale: 0.95 },
      { x: -45.0, z: 6.0,   scale: 1.05 },
      { x: -44.0, z: 18.0,  scale: 0.95 },
      { x: -45.0, z: 29.0,  scale: 1.10 },
      { x: -44.0, z: 39.0,  scale: 1.00 }
    ];

    spruceLocations.forEach((p, pIdx) => {
      const pineGroup = new THREE.Group();
      pineGroup.position.set(p.x, 0, p.z);
      const rotY = (pseudoRand(pIdx * 43.3 + 12.7) - 0.5) * Math.PI * 2;
      pineGroup.rotation.y = rotY;
      this.scene.add(pineGroup);

      const pTrunkH = 8.2 * p.scale;
      const pRadius = 0.44 * p.scale;

      // Solid collision cylinder matching spruce base
      this.world.addCylinderCollider(p.x, p.z, pRadius, pTrunkH);
      const pBox = new THREE.Box3(
        new THREE.Vector3(p.x - pRadius, 0, p.z - pRadius),
        new THREE.Vector3(p.x + pRadius, pTrunkH, p.z + pRadius)
      );
      this.world.colliders.push({ box: pBox, mesh: pineGroup, type: 'solid', isCylinder: true });

      // Asynchronously instantiate Blender Spruce model
      assetPipeline.loadModel('/models/tree_spruce.glb', { collision: 'none' }).then(res => {
        if (res && res.model) {
          const m = res.model.clone(true);
          m.scale.set(p.scale, p.scale, p.scale);
          m.traverse(c => {
            if (c.isMesh) {
              c.castShadow = true;
              c.receiveShadow = true;
            }
          });
          pineGroup.add(m);
        }
      }).catch(err => {
        console.warn('⚠️ [World] Failed to load tree_spruce.glb:', err);
      });
    });
  }

  /**
   * Handcrafted Environmental Storytelling Props:
   * Rustic Wheelbarrow, Garden Stone Well Plaza, Farm Cart, Stacked Produce Crates,
   * Oak Barrels, and Orchard Picnic Bench
   */
  buildEnvironmentalStorytelling() {
    const woodMat = this.materials.wood;
    const logMat = this.materials.timberLog;
    const ironMat = this.materials.ironMetal;

    // 1. RUSTIC WOODEN WHEELBARROW parked at Garden Gate at (-8.5, -9)
    const wbGroup = new THREE.Group();
    wbGroup.position.set(-8.5, 0, -9);
    wbGroup.rotation.y = 0.4;

    const tray = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.45, 0.9), woodMat);
    tray.position.set(0, 0.55, 0);
    tray.rotation.z = -0.15;
    tray.castShadow = true;
    wbGroup.add(tray);

    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.08, 12), ironMat);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(0.7, 0.35, 0);
    wheel.castShadow = true;
    wbGroup.add(wheel);

    const handleGeo = new THREE.BoxGeometry(1.5, 0.08, 0.08);
    const hL = new THREE.Mesh(handleGeo, logMat); hL.position.set(-0.3, 0.6, 0.35); hL.rotation.z = -0.15; wbGroup.add(hL);
    const hR = new THREE.Mesh(handleGeo, logMat); hR.position.set(-0.3, 0.6, -0.35); hR.rotation.z = -0.15; wbGroup.add(hR);

    const legGeo = new THREE.BoxGeometry(0.08, 0.45, 0.08);
    const legL = new THREE.Mesh(legGeo, logMat); legL.position.set(-0.5, 0.25, 0.35); wbGroup.add(legL);
    const legR = new THREE.Mesh(legGeo, logMat); legR.position.set(-0.5, 0.25, -0.35); wbGroup.add(legR);

    // Harvested produce in wheelbarrow tray
    const wbPump = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 8), new THREE.MeshStandardMaterial({ color: 0xea580c }));
    wbPump.position.set(-0.1, 0.72, 0.1);
    wbGroup.add(wbPump);

    for (let k = 0; k < 3; k++) {
      const carrot = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.28, 5), this.materials.leafLight);
      carrot.position.set(0.1 + k * 0.15, 0.72, -0.15);
      wbGroup.add(carrot);
    }
    this.scene.add(wbGroup);

    // 2. STONE WATER WELL & PUMP PLAZA at (-16, -8) (next to garden entrance, leaves lane open!)
    this.createGardenStoneWell(-16, -8);

    // 3. TWO-WHEELED FARM CART WITH HAY BALES along Orchard Lane at (8.5, -9)
    const cartGroup = new THREE.Group();
    cartGroup.position.set(8.5, 0, -9);
    cartGroup.rotation.y = -0.35;

    const cartBed = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.3, 1.4), woodMat);
    cartBed.position.set(0, 0.65, 0);
    cartBed.castShadow = true;
    cartGroup.add(cartBed);

    const cartWheelGeo = new THREE.CylinderGeometry(0.55, 0.55, 0.12, 12);
    const cwL = new THREE.Mesh(cartWheelGeo, woodMat); cwL.rotation.z = Math.PI / 2; cwL.position.set(0, 0.55, 0.8); cwL.castShadow = true; cartGroup.add(cwL);
    const cwR = new THREE.Mesh(cartWheelGeo, woodMat); cwR.rotation.z = Math.PI / 2; cwR.position.set(0, 0.55, -0.8); cwR.castShadow = true; cartGroup.add(cwR);

    const shaft = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.1, 0.1), logMat);
    shaft.position.set(-1.8, 0.45, 0);
    shaft.rotation.z = 0.12;
    cartGroup.add(shaft);

    const cartHay1 = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.8, 1.0), this.materials.straw);
    cartHay1.position.set(0, 1.1, 0);
    cartHay1.castShadow = true;
    cartGroup.add(cartHay1);

    this.scene.add(cartGroup);

    // 4. STACKED HARVEST PRODUCE CRATES
    const crateMat = woodMat;
    const cratePositions = [
      { x: -8.5, z: -17, type: 'carrots' },
      { x: 8.5, z: -17, type: 'pumpkins' },
      { x: 16.5, z: -9, type: 'apples' },
      { x: 17.5, z: -8.5, type: 'apples' }
    ];

    cratePositions.forEach(cp => {
      const crate = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.65, 0.95), crateMat);
      crate.position.set(cp.x, 0.325, cp.z);
      crate.castShadow = true;
      crate.receiveShadow = true;
      this.scene.add(crate);

      if (cp.type === 'carrots') {
        for (let k = 0; k < 5; k++) {
          const cTop = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.25, 5), this.materials.leafLight);
          cTop.position.set(cp.x - 0.2 + (k % 3) * 0.2, 0.72, cp.z - 0.2 + Math.floor(k / 3) * 0.4);
          this.scene.add(cTop);
        }
      } else if (cp.type === 'pumpkins') {
        const miniP = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 8), new THREE.MeshStandardMaterial({ color: 0xea580c }));
        miniP.position.set(cp.x, 0.75, cp.z);
        this.scene.add(miniP);
      } else if (cp.type === 'apples') {
        for (let k = 0; k < 6; k++) {
          const ap = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), this.materials.apple);
          ap.position.set(cp.x - 0.25 + (k % 3) * 0.25, 0.72, cp.z - 0.15 + Math.floor(k / 3) * 0.3);
          this.scene.add(ap);
        }
      }
    });

    // 5. ORCHARD PICNIC AREA under apple trees
    const picnicGroup = new THREE.Group();
    picnicGroup.position.set(26, 0, -1);

    const table = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.8, 1.2), woodMat);
    table.position.set(0, 0.4, 0);
    table.castShadow = true;
    picnicGroup.add(table);

    const bench1 = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.45, 0.4), woodMat);
    bench1.position.set(0, 0.225, 1.0);
    picnicGroup.add(bench1);

    const bench2 = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.45, 0.4), woodMat);
    bench2.position.set(0, 0.225, -1.0);
    picnicGroup.add(bench2);

    this.scene.add(picnicGroup);

    // 6. WELCOMING FARM SIGNPOST AT SPAWN: "Meadow Valley Homestead"
    const signGroup = new THREE.Group();
    signGroup.position.set(3.4, 0, -2);
    signGroup.rotation.y = -0.25;

    const sPost1 = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 2.2, 7), logMat);
    sPost1.position.set(-1.0, 1.1, 0);
    signGroup.add(sPost1);

    const sPost2 = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 2.2, 7), logMat);
    sPost2.position.set(1.0, 1.1, 0);
    signGroup.add(sPost2);

    const sBoard = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.65, 0.1), woodMat);
    sBoard.position.set(0, 1.6, 0);
    signGroup.add(sBoard);

    this.scene.add(signGroup);
  }

  createGardenStoneWell(x, z) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    this.scene.add(group);

    // Collision proxy: well base cylinder radius 1.35m, height 1.5m
    const wellRadius = 1.35;
    const wellHeight = 1.5;
    this.world.addCylinderCollider(x, z, wellRadius, wellHeight);
    const wellBox = new THREE.Box3(
      new THREE.Vector3(x - wellRadius, 0, z - wellRadius),
      new THREE.Vector3(x + wellRadius, wellHeight, z + wellRadius)
    );

    // Invisible interaction proxy mesh for raycast targeting
    const wellProxy = new THREE.Mesh(
      new THREE.CylinderGeometry(wellRadius, wellRadius, wellHeight, 12),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    wellProxy.position.set(0, wellHeight / 2, 0);
    group.add(wellProxy);

    this.world.colliders.push({ box: wellBox, mesh: wellProxy, type: 'solid', isCylinder: true });

    // Interactive Stone Well for refilling Watering Can
    const wellInteractable = {
      id: 'stone_well',
      mesh: wellProxy,
      name: 'Stone Well',
      prompt: 'Refill Watering Can',
      ready: true,
      interact: (player) => {
        if (player.farmingManager) {
          player.farmingManager.refillWateringCan();
        }
      }
    };
    this.interactables.push(wellInteractable);

    // Asynchronously instantiate handcrafted Blender Stone Well model
    assetPipeline.loadModel('/models/farm_well.glb', { collision: 'none' }).then(res => {
      if (res && res.model) {
        const m = res.model.clone(true);
        m.traverse(c => {
          if (c.isMesh) {
            c.castShadow = true;
            c.receiveShadow = true;
          }
        });
        group.add(m);

        // Bind stone node as interaction mesh
        const stoneNode = m.getObjectByName('well_stone') || m;
        wellInteractable.mesh = stoneNode;
      }
    }).catch(err => {
      console.warn('⚠️ [World] Failed to load farm_well.glb:', err);
    });
  }

  /**
   * Layered 3D Grass Tufts, Wildflowers, and Low-Poly Shrubbery
   */
  buildVegetationLayers() {
    const grassBladeMat = this.materials.leafLight;
    const bushMat = this.materials.bushBright;

    // 1. 3D Grass Blade Tufts
    const tuftLocations = [];
    for (let i = 0; i < 110; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 4 + Math.random() * 46;
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;

      if (Math.abs(x) < 23 && Math.abs(z + 14) < 6) continue;
      if (Math.abs(x) < 23 && Math.abs(z - 16) < 6) continue;
      if (Math.abs(x) < 2.4 && Math.abs(z) < 32) continue;

      tuftLocations.push({ x, z, scale: 0.65 + Math.random() * 0.6 });
    }

    // 1. 3D Grass Blade Tufts (Instanced for high-performance rendering)
    const bladeGeo = new THREE.ConeGeometry(0.06, 0.55, 4);
    const totalBlades = tuftLocations.length * 5;
    const instancedGrass = new THREE.InstancedMesh(bladeGeo, grassBladeMat, totalBlades);
    instancedGrass.receiveShadow = true;

    const dummyG = new THREE.Object3D();
    let gIdx = 0;
    tuftLocations.forEach(tl => {
      for (let b = 0; b < 5; b++) {
        const rotY = (b / 5) * Math.PI * 2;
        dummyG.position.set(
          tl.x + Math.cos(rotY) * 0.08,
          0.02 + 0.28 * tl.scale,
          tl.z + Math.sin(rotY) * 0.08
        );
        dummyG.rotation.set(0, rotY, 0.24);
        dummyG.scale.set(tl.scale, tl.scale, tl.scale);
        dummyG.updateMatrix();
        instancedGrass.setMatrixAt(gIdx++, dummyG.matrix);
      }
    });
    instancedGrass.instanceMatrix.needsUpdate = true;
    this.scene.add(instancedGrass);

    // 2. Handcrafted Blender Alpine Shrubbery & Currant Bushes
    const bushPlacements = [
      // Terrace flanking bushes (framing the farmhouse garden and stone retaining wall)
      { x: -7.5, z: -25.5, s: 1.15 },
      { x: 7.5,  z: -25.5, s: 1.10 },
      { x: -11.5, z: -27.5, s: 1.25 },
      { x: 11.5,  z: -27.5, s: 1.20 },
      { x: -9.0, z: -18.5, s: 1.05 },
      { x: 9.0,  z: -18.5, s: 1.05 },
      // Path and field borders (framing country lane and crop beds)
      { x: -6.5, z: -6.0, s: 0.95 },
      { x: 6.5,  z: -6.0, s: 0.95 },
      { x: -6.5, z: 7.5,  s: 1.00 },
      { x: 6.5,  z: 7.5,  s: 1.00 },
      // Orchard & meadow borders
      { x: 16.5, z: -3.5, s: 1.10 },
      { x: 28.5, z: -3.5, s: 1.05 },
      { x: -21.5, z: 2.0,  s: 1.15 },
      { x: -21.5, z: 12.0, s: 1.10 }
    ];

    bushPlacements.forEach(bp => {
      this.createStylizedBush(bp.x, bp.z, bp.s);
    });
  }

  createStylizedBush(x, z, scale = 1.0) {
    const bGroup = new THREE.Group();
    // Correct ground elevation: terrace knoll elevation is +0.60m for z <= -23 and |x| <= 14
    const baseY = (z <= -23 && Math.abs(x) <= 14) ? 0.60 : 0.0;
    bGroup.position.set(x, baseY, z);
    bGroup.rotation.y = Math.random() * Math.PI * 2;
    this.scene.add(bGroup);

    // Asynchronously instantiate handcrafted Blender Shrub Bush model
    assetPipeline.loadModel('/models/shrub_bush.glb', { collision: 'none' }).then(res => {
      if (res && res.model) {
        const m = res.model.clone(true);
        m.scale.set(scale, scale, scale);
        m.traverse(c => {
          if (c.isMesh) {
            c.castShadow = true;
            c.receiveShadow = true;
          }
        });
        bGroup.add(m);
      }
    }).catch(err => {
      console.warn('⚠️ [World] Failed to load shrub_bush.glb:', err);
    });

    return bGroup;
  }

  update(dt, totalTime) {
    // 1. Drifting cumulus clouds across blue sky
    for (const c of this.clouds) {
      c.group.position.x += c.speed * dt * 2.0;
      if (c.group.position.x > 175) {
        c.group.position.x = -175;
      }
    }

    // 2. Fruit regrowth on trees & subtle leaf wind sway
    for (const t of this.fruitTrees) {
      for (const f of t.fruits) {
        f.update(dt);
      }
      if (t.canopy) {
        const sway = Math.sin(totalTime * 1.8 + t.phaseOffset) * 0.022;
        t.canopy.rotation.z = sway;
      }
    }

    // 3. Crop plant regrowth & gentle wind sway
    for (const cp of this.cropPlants) {
      cp.update(dt);
    }

    for (const f of this.animatedFoliage) {
      if (f.foliage) {
        const sway = Math.sin(totalTime * 2.2 + f.phaseOffset) * 0.038;
        f.foliage.rotation.z = sway;
      }
    }

    // 4. Chimney smoke rising softly
    for (const s of this.smokeParticles) {
      s.mesh.position.y += dt * 0.8;
      s.mesh.position.x += Math.sin(totalTime * 1.5 + s.offset) * dt * 0.2;
      s.mesh.scale.addScalar(dt * 0.15);
      if (s.mesh.position.y > s.baseY + 4.5) {
        s.mesh.position.copy(this.chimneySmokeOrigin);
        s.mesh.scale.set(1, 1, 1);
      }
    }

    // 5. Hearth firelight organic flicker
    if (this.isFireLit && this.hearthLight) {
      this.hearthLight.intensity = 2.6 + Math.sin(totalTime * 8) * 0.2 + Math.sin(totalTime * 17) * 0.12;
    }

    // 6. Farmhouse front door smooth hinge swing animation
    if (this.farmhouseDoorPivot) {
      const targetAngle = this.isFarmhouseDoorOpen ? -Math.PI / 2 : 0.0;
      this.farmhouseDoorPivot.rotation.y += (targetAngle - this.farmhouseDoorPivot.rotation.y) * Math.min(1.0, 8.0 * dt);
    }
  }

  /**
   * Deterministically restores crop and orchard fruit states and regrowth timers from save data
   * @param {Object} savedCrops 
   * @param {Object} savedFruits 
   */
  restoreCropsAndFruits(savedCrops = {}, savedFruits = {}) {
    if (savedCrops) {
      this.cropPlants.forEach(crop => {
        if (crop.id && savedCrops[crop.id] !== undefined) {
          const state = savedCrops[crop.id];
          crop.ready = !!state.ready;
          crop.growTimer = typeof state.growTimer === 'number' ? state.growTimer : 0;
          if (!crop.ready) {
            const progress = 1 - (crop.growTimer / crop.regrowTime);
            const scale = Math.min(1.0, 0.1 + Math.max(0, progress) * 0.9);
            crop.mesh.scale.set(scale, scale, scale);
          } else {
            crop.mesh.scale.set(1, 1, 1);
          }
        }
      });
    }

    if (savedFruits) {
      this.fruitTrees.forEach(tree => {
        if (tree.fruits) {
          tree.fruits.forEach(fruit => {
            if (fruit.id && savedFruits[fruit.id] !== undefined) {
              const state = savedFruits[fruit.id];
              fruit.ready = !!state.ready;
              fruit.growTimer = typeof state.growTimer === 'number' ? state.growTimer : 0;
              fruit.pluckTimer = 0;
              if (!fruit.ready) {
                const progress = 1 - (fruit.growTimer / fruit.regrowTime);
                if (progress <= 0.04) {
                  if (fruit.mesh) fruit.mesh.visible = false;
                } else {
                  const smoothP = progress * progress * (3 - 2 * progress);
                  const scale = Math.min(1.0, 0.08 + Math.max(0, smoothP) * 0.92);
                  if (fruit.mesh) {
                    fruit.mesh.visible = true;
                    fruit.mesh.scale.set(scale, scale, scale);
                  }
                }
              } else {
                if (fruit.mesh) {
                  fruit.mesh.visible = true;
                  fruit.mesh.scale.set(1, 1, 1);
                }
              }
            }
          });
        }
      });
    }
  }
}
