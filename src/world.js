import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { sounds } from './audio.js';
import { events } from './events.js';

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
      bushDark: new THREE.MeshStandardMaterial({ color: 0x276749, roughness: 0.75, flatShading: false }),
      bushBright: new THREE.MeshStandardMaterial({ color: 0x38a169, roughness: 0.75, flatShading: false }),
      straw: new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.85, flatShading: true }),
      strawTwine: new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 }),
      ironMetal: new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5, metalness: 0.7 })
    };

    this.initSkyAndLighting();
    this.buildMeadowAndTerrace();
    this.buildLayeredMountainHorizon();
    this.buildAlpineFarmhouse();
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
    this.cloudMaterial = new THREE.MeshLambertMaterial({
      color: 0xffffff,
      flatShading: true,
      transparent: true,
      opacity: 0.95,
      fog: true
    });
    const cloudMat = this.cloudMaterial;

    for (let i = 0; i < 28; i++) {
      const cloudGroup = new THREE.Group();
      const numPuffs = 5 + Math.floor(Math.random() * 5);

      for (let p = 0; p < numPuffs; p++) {
        const size = 8 + Math.random() * 9;
        const puff = new THREE.Mesh(new THREE.DodecahedronGeometry(size, 1), cloudMat);
        puff.position.set(
          (Math.random() - 0.5) * 24,
          (Math.random() - 0.5) * 5,
          (Math.random() - 0.5) * 16
        );
        cloudGroup.add(puff);
      }

      const x = (Math.random() - 0.5) * 280;
      const z = (Math.random() - 0.5) * 280;
      const y = 68 + Math.random() * 28;
      cloudGroup.position.set(x, y, z);
      this.scene.add(cloudGroup);

      this.clouds.push({
        group: cloudGroup,
        speed: 0.35 + Math.random() * 0.55
      });
    }
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

    // Naturally embedded rustic flagstone edging along the main lane
    const cobbleMat = new THREE.MeshStandardMaterial({ color: 0x857d77, roughness: 0.92, flatShading: true });
    for (let z = -20; z <= 30; z += 1.8) {
      const stoneL = new THREE.Mesh(
        new THREE.CylinderGeometry(0.32 + Math.sin(z) * 0.08, 0.42 + Math.cos(z) * 0.08, 0.05, 6),
        cobbleMat
      );
      stoneL.position.set(-2.3 + Math.sin(z * 0.6) * 0.22, 0.025, z);
      stoneL.rotation.y = Math.sin(z) * Math.PI;
      stoneL.receiveShadow = true;
      this.scene.add(stoneL);

      const stoneR = new THREE.Mesh(
        new THREE.CylinderGeometry(0.32 + Math.cos(z) * 0.08, 0.42 + Math.sin(z) * 0.08, 0.05, 6),
        cobbleMat
      );
      stoneR.position.set(2.3 + Math.cos(z * 0.6) * 0.22, 0.025, z);
      stoneR.rotation.y = Math.cos(z) * Math.PI;
      stoneR.receiveShadow = true;
      this.scene.add(stoneR);
    }
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
      mainMesh.castShadow = true;
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

    // 1. DISTANT ALPINE RANGES (pushed back to 115m - 145m, framing the sky gracefully)
    // North Range (magnificent panoramic backdrop behind Farmhouse)
    const northMassifs = [
      { x: -95, z: -125, r: 58, h: 36, yaw: 0.3, sx: 1.4, sz: 0.9 },
      { x: -50, z: -138, r: 64, h: 40, yaw: 0.8, sx: 1.3, sz: 1.0 },
      { x: -5,  z: -142, r: 68, h: 42, yaw: 0.2, sx: 1.5, sz: 0.9 },
      { x: 42,  z: -136, r: 62, h: 39, yaw: 1.1, sx: 1.3, sz: 1.0 },
      { x: 88,  z: -126, r: 56, h: 35, yaw: 0.5, sx: 1.4, sz: 0.9 }
    ];
    northMassifs.forEach(m => createSweepingMountain(m.x, m.z, m.r, m.h, m.yaw, m.sx, m.sz, rockFar, true));

    // South Range
    const southMassifs = [
      { x: -90, z: 125, r: 56, h: 36, yaw: 0.4, sx: 1.4, sz: 0.9 },
      { x: -45, z: 135, r: 62, h: 38, yaw: 0.9, sx: 1.3, sz: 1.0 },
      { x: 5,   z: 140, r: 66, h: 41, yaw: 0.3, sx: 1.5, sz: 0.9 },
      { x: 50,  z: 134, r: 60, h: 37, yaw: 1.2, sx: 1.3, sz: 1.0 },
      { x: 92,  z: 124, r: 54, h: 34, yaw: 0.6, sx: 1.4, sz: 0.9 }
    ];
    southMassifs.forEach(m => createSweepingMountain(m.x, m.z, m.r, m.h, m.yaw, m.sx, m.sz, rockFar, true));

    // West Range
    const westMassifs = [
      { x: -128, z: -70, r: 55, h: 36, yaw: 1.5, sx: 0.9, sz: 1.4 },
      { x: -138, z: -20, r: 62, h: 39, yaw: 1.7, sx: 0.9, sz: 1.3 },
      { x: -138, z: 30,  r: 60, h: 38, yaw: 1.4, sx: 0.9, sz: 1.4 },
      { x: -126, z: 75,  r: 54, h: 35, yaw: 1.6, sx: 0.9, sz: 1.3 }
    ];
    westMassifs.forEach(m => createSweepingMountain(m.x, m.z, m.r, m.h, m.yaw, m.sx, m.sz, rockFar, true));

    // East Range
    const eastMassifs = [
      { x: 128, z: -70, r: 55, h: 36, yaw: 1.5, sx: 0.9, sz: 1.4 },
      { x: 138, z: -20, r: 62, h: 39, yaw: 1.7, sx: 0.9, sz: 1.3 },
      { x: 138, z: 30,  r: 60, h: 38, yaw: 1.4, sx: 0.9, sz: 1.4 },
      { x: 126, z: 75,  r: 54, h: 35, yaw: 1.6, sx: 0.9, sz: 1.3 }
    ];
    eastMassifs.forEach(m => createSweepingMountain(m.x, m.z, m.r, m.h, m.yaw, m.sx, m.sz, rockFar, true));

    // 2. MIDGROUND MOUNTAIN RIDGES & CRAGS (at 85m - 98m, lower and darker)
    const midCrags = [
      { x: -62, z: -88, r: 42, h: 26, yaw: 0.4, sx: 1.3, sz: 0.9 },
      { x: -22, z: -94, r: 44, h: 27, yaw: 0.8, sx: 1.2, sz: 1.0 },
      { x: 24,  z: -92, r: 43, h: 26, yaw: 0.2, sx: 1.3, sz: 0.9 },
      { x: 64,  z: -86, r: 40, h: 25, yaw: 1.0, sx: 1.2, sz: 1.0 },
      { x: -88, z: -25, r: 40, h: 25, yaw: 1.5, sx: 0.9, sz: 1.2 },
      { x: -88, z: 35,  r: 40, h: 24, yaw: 1.6, sx: 0.9, sz: 1.2 },
      { x: 88,  z: -25, r: 40, h: 25, yaw: 1.5, sx: 0.9, sz: 1.2 },
      { x: 88,  z: 35,  r: 40, h: 24, yaw: 1.6, sx: 0.9, sz: 1.2 }
    ];
    midCrags.forEach(mc => createSweepingMountain(mc.x, mc.z, mc.r, mc.h, mc.yaw, mc.sx, mc.sz, rockMid, false));

    // 3. ROLLING ALPINE FOOTHILLS (gentle green mounds connecting valley floor to mountains)
    for (let f = 0; f < 18; f++) {
      const angle = (f / 18) * Math.PI * 2;
      const dist = 66 + (f % 2) * 6;
      const fx = Math.cos(angle) * dist;
      const fz = Math.sin(angle) * dist;
      const fr = 26 + (f % 3) * 4;
      const fh = 12 + (f % 2) * 4;

      const hillGeo = new THREE.ConeGeometry(fr, fh, 7);
      hillGeo.scale(1.2, 1.0, 0.9);
      const hillMesh = new THREE.Mesh(hillGeo, foothillMat);
      hillMesh.position.set(fx, fh / 2, fz);
      hillMesh.rotation.y = angle + 0.3;
      hillMesh.castShadow = true;
      hillMesh.receiveShadow = true;
      this.scene.add(hillMesh);
    }

    // 4. VALLEY PERIMETER COLLIDERS (clean invisible barrier boundary at radius ~65m)
    for (let b = 0; b < 16; b++) {
      const angle = (b / 16) * Math.PI * 2;
      const bx = Math.cos(angle) * 68;
      const bz = Math.sin(angle) * 68;
      const barrier = new THREE.Mesh(
        new THREE.BoxGeometry(28, 25, 28),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      barrier.position.set(bx, 12.5, bz);
      this.scene.add(barrier);
      this.world.addBoxCollider(barrier);
    }
  }

  /**
   * Grand 2-Story Alpine Chalet Homestead
   * Features: Whitewashed stone foundation, timber upper floor, true gabled roof with eaves,
   * wrap-around veranda with steps, stone chimney with smoke puffs, flower boxes, and wood shed
   */
  buildAlpineFarmhouse() {
    const houseGroup = new THREE.Group();
    const houseX = 0;
    const terraceElevation = 0.6;
    const houseZ = -34;
    houseGroup.position.set(houseX, terraceElevation, houseZ);

    const woodMat = this.materials.wood;
    const logMat = this.materials.timberLog;
    const roofMat = this.materials.roof;
    const stoneMat = this.materials.stoneWall;
    const stuccoMat = this.materials.whiteStucco;
    const brickMat = this.materials.brick;
    const windowMat = this.materials.windowWarm;

    const houseW = 12.0;
    const houseD = 9.4;

    // 1. Whitewashed Fieldstone Ground Floor (Height 3.4m)
    const groundFloorH = 3.4;
    const groundFloor = new THREE.Mesh(new THREE.BoxGeometry(houseW, groundFloorH, houseD), stuccoMat);
    groundFloor.position.set(0, groundFloorH / 2, 0);
    groundFloor.castShadow = true;
    groundFloor.receiveShadow = true;
    houseGroup.add(groundFloor);

    // Stone foundation skirting
    const skirting = new THREE.Mesh(new THREE.BoxGeometry(houseW + 0.3, 0.9, houseD + 0.3), stoneMat);
    skirting.position.set(0, 0.45, 0);
    skirting.castShadow = true;
    houseGroup.add(skirting);

    // Timber corner posts & belt course
    const postG = new THREE.BoxGeometry(0.35, groundFloorH, 0.35);
    [
      [-houseW / 2, -houseD / 2], [houseW / 2, -houseD / 2],
      [-houseW / 2, houseD / 2], [houseW / 2, houseD / 2]
    ].forEach(([cx, cz]) => {
      const post = new THREE.Mesh(postG, logMat);
      post.position.set(cx, groundFloorH / 2, cz);
      post.castShadow = true;
      houseGroup.add(post);
    });

    const beltCourse = new THREE.Mesh(new THREE.BoxGeometry(houseW + 0.4, 0.25, houseD + 0.4), logMat);
    beltCourse.position.set(0, groundFloorH, 0);
    beltCourse.castShadow = true;
    houseGroup.add(beltCourse);

    // 2. Timber Plank Upper Story (Height 2.8m)
    const upperH = 2.8;
    const upperFloor = new THREE.Mesh(new THREE.BoxGeometry(houseW - 0.2, upperH, houseD - 0.2), woodMat);
    upperFloor.position.set(0, groundFloorH + upperH / 2, 0);
    upperFloor.castShadow = true;
    upperFloor.receiveShadow = true;
    houseGroup.add(upperFloor);

    // Cantilevered Upper Balcony
    const balconyW = 6.0;
    const balconyD = 1.6;
    const balconyDeck = new THREE.Mesh(new THREE.BoxGeometry(balconyW, 0.2, balconyD), woodMat);
    balconyDeck.position.set(0, groundFloorH + 0.1, houseD / 2 + balconyD / 2 - 0.1);
    balconyDeck.castShadow = true;
    houseGroup.add(balconyDeck);

    // Balcony Railing with carved timber spindles
    const balRailing = new THREE.Mesh(new THREE.BoxGeometry(balconyW, 0.85, 0.1), logMat);
    balRailing.position.set(0, groundFloorH + 0.55, houseD / 2 + balconyD - 0.15);
    houseGroup.add(balRailing);

    // 3. TRUE ALPINE GABLED ROOF WITH OVERHANGING EAVES
    // Two pitched roof slopes meeting at the central horizontal ridge beam
    const roofSlopeW = houseW + 1.6;
    const roofSlopeL = (houseD / 2) * 1.35;
    const roofPitch = 0.62; // ~35 degrees

    // South roof slope (front)
    const southSlope = new THREE.Mesh(new THREE.BoxGeometry(roofSlopeW, 0.22, roofSlopeL), roofMat);
    southSlope.position.set(0, groundFloorH + upperH + 1.25, houseD / 4 + 0.2);
    southSlope.rotation.x = roofPitch;
    southSlope.castShadow = true;
    southSlope.receiveShadow = true;
    houseGroup.add(southSlope);

    // North roof slope (back)
    const northSlope = new THREE.Mesh(new THREE.BoxGeometry(roofSlopeW, 0.22, roofSlopeL), roofMat);
    northSlope.position.set(0, groundFloorH + upperH + 1.25, -houseD / 4 - 0.2);
    northSlope.rotation.x = -roofPitch;
    northSlope.castShadow = true;
    northSlope.receiveShadow = true;
    houseGroup.add(northSlope);

    // Ridge beam cap
    const ridgeCap = new THREE.Mesh(new THREE.BoxGeometry(roofSlopeW + 0.2, 0.25, 0.4), logMat);
    ridgeCap.position.set(0, groundFloorH + upperH + 2.55, 0);
    ridgeCap.castShadow = true;
    houseGroup.add(ridgeCap);

    // Triangular Gable Attic Wall Panels (Enclosing West & East attic under gables cleanly)
    const gableWest = new THREE.Mesh(new THREE.BoxGeometry(0.18, 2.2, houseD * 0.72), woodMat);
    gableWest.position.set(-houseW / 2 + 0.05, groundFloorH + upperH + 1.1, 0);
    houseGroup.add(gableWest);

    const gableEast = new THREE.Mesh(new THREE.BoxGeometry(0.18, 2.2, houseD * 0.72), woodMat);
    gableEast.position.set(houseW / 2 - 0.05, groundFloorH + upperH + 1.1, 0);
    houseGroup.add(gableEast);

    // Attic Dormer Window
    const dormer = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.4, 1.6), woodMat);
    dormer.position.set(0, groundFloorH + upperH + 1.2, houseD / 4 + 0.6);
    dormer.castShadow = true;
    houseGroup.add(dormer);

    const dormerWin = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.9, 0.1), windowMat);
    dormerWin.position.set(0, groundFloorH + upperH + 1.2, houseD / 4 + 1.45);
    houseGroup.add(dormerWin);

    // 4. Sturdy Fieldstone Chimney with Rising Smoke Puffs
    const chimney = new THREE.Mesh(new THREE.BoxGeometry(1.6, 9.8, 1.8), brickMat);
    chimney.position.set(houseW / 2 + 0.2, 4.9, 0.6);
    chimney.castShadow = true;
    chimney.receiveShadow = true;
    houseGroup.add(chimney);

    const chimneyCap = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.3, 2.1), stoneMat);
    chimneyCap.position.set(houseW / 2 + 0.2, 9.9, 0.6);
    chimneyCap.castShadow = true;
    houseGroup.add(chimneyCap);

    const potGeo = new THREE.CylinderGeometry(0.22, 0.25, 0.6, 8);
    const pot1 = new THREE.Mesh(potGeo, stoneMat); pot1.position.set(houseW / 2 + 0.2, 10.35, 0.2); houseGroup.add(pot1);
    const pot2 = new THREE.Mesh(potGeo, stoneMat); pot2.position.set(houseW / 2 + 0.2, 10.35, 1.0); houseGroup.add(pot2);

    this.chimneySmokeOrigin = new THREE.Vector3(
      houseX + houseW / 2 + 0.2,
      terraceElevation + 10.7,
      houseZ + 0.6
    );

    // 5. Wrap-Around Front Veranda (Porch)
    const porchW = houseW + 0.8;
    const porchD = 3.2;
    const porchH = 0.4;
    const porchDeck = new THREE.Mesh(new THREE.BoxGeometry(porchW, porchH, porchD), woodMat);
    porchDeck.position.set(0, porchH / 2, houseD / 2 + porchD / 2);
    porchDeck.castShadow = true;
    porchDeck.receiveShadow = true;
    houseGroup.add(porchDeck);

    // Heavy timber porch log pillars
    const pillarGeo = new THREE.CylinderGeometry(0.14, 0.16, 2.8, 8);
    [-porchW / 2 + 0.4, -porchW / 4, 0, porchW / 4, porchW / 2 - 0.4].forEach(px => {
      const pil = new THREE.Mesh(pillarGeo, logMat);
      pil.position.set(px, 1.8, houseD / 2 + porchD - 0.3);
      pil.castShadow = true;
      houseGroup.add(pil);
    });

    // Veranda Overhang Roof
    const porchRoof = new THREE.Mesh(new THREE.BoxGeometry(porchW + 0.4, 0.28, porchD + 0.6), roofMat);
    porchRoof.position.set(0, 3.25, houseD / 2 + porchD / 2);
    porchRoof.rotation.x = 0.14;
    porchRoof.castShadow = true;
    houseGroup.add(porchRoof);

    // Rustic Porch Bench
    const benchGroup = new THREE.Group();
    benchGroup.position.set(houseW / 4 + 0.6, 0.4, houseD / 2 + 1.2);
    const bSeat = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.1, 0.55), woodMat);
    bSeat.position.set(0, 0.45, 0);
    benchGroup.add(bSeat);
    const bBack = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.5, 0.08), woodMat);
    bBack.position.set(0, 0.72, -0.24);
    benchGroup.add(bBack);
    [-0.75, 0.75].forEach(bx => {
      const bLeg = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.45, 0.45), logMat);
      bLeg.position.set(bx, 0.22, 0);
      benchGroup.add(bLeg);
    });
    houseGroup.add(benchGroup);

    // Warm Hanging Porch Lantern on pillar
    const lanternGroup = new THREE.Group();
    lanternGroup.position.set(-porchW / 4, 2.5, houseD / 2 + porchD - 0.3);
    const lFrame = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.28, 6), this.materials.ironMetal);
    lanternGroup.add(lFrame);
    const lGlass = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.2, 6), this.materials.windowWarm);
    lanternGroup.add(lGlass);
    const lLight = new THREE.PointLight(0xfef08a, 0.9, 8);
    this.lanternLight = lLight;
    lanternGroup.add(lLight);
    houseGroup.add(lanternGroup);

    // Porch steps down to terrace top
    const pStep = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.2, 0.6), woodMat);
    pStep.position.set(0, 0.1, houseD / 2 + porchD + 0.3);
    pStep.receiveShadow = true;
    houseGroup.add(pStep);

    // 6. Front Door & Hanging Lanterns
    const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.5, 0.18), logMat);
    doorFrame.position.set(0, 1.65, houseD / 2 + 0.05);
    houseGroup.add(doorFrame);

    const door = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.2, 0.1), woodMat);
    door.position.set(0, 1.5, houseD / 2 + 0.1);
    houseGroup.add(door);

    [-1.2, 1.2].forEach(lx => {
      const lant = new THREE.Mesh(new THREE.DodecahedronGeometry(0.18, 0), windowMat);
      lant.position.set(lx, 2.7, houseD / 2 + 0.2);
      houseGroup.add(lant);
    });

    // 7. Ground Floor Windows with Flower Boxes
    [-3.6, -1.8, 1.8, 3.6].forEach(wx => {
      const win = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.4, 0.12), windowMat);
      win.position.set(wx, 2.1, houseD / 2 + 0.05);
      houseGroup.add(win);

      const fBox = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.25, 0.35), logMat);
      fBox.position.set(wx, 1.3, houseD / 2 + 0.22);
      houseGroup.add(fBox);

      for (let f = 0; f < 6; f++) {
        const fl = new THREE.Mesh(
          new THREE.SphereGeometry(0.09, 6, 6),
          f % 2 === 0 ? this.materials.poppy : this.materials.buttercup
        );
        fl.position.set(wx - 0.6 + f * 0.24, 1.5, houseD / 2 + 0.22);
        houseGroup.add(fl);
      }
    });

    // 8. Attached Wood Shed on West Wall
    const shedW = 3.4;
    const shedH = 2.4;
    const shedD = 4.2;
    const shed = new THREE.Mesh(new THREE.BoxGeometry(shedW, shedH, shedD), woodMat);
    shed.position.set(-houseW / 2 - shedW / 2, shedH / 2, 0);
    shed.castShadow = true;
    houseGroup.add(shed);

    const shedRoof = new THREE.Mesh(new THREE.BoxGeometry(shedW + 0.4, 0.2, shedD + 0.4), roofMat);
    shedRoof.position.set(-houseW / 2 - shedW / 2, shedH + 0.1, 0);
    shedRoof.rotation.z = -0.18;
    houseGroup.add(shedRoof);

    // Chopped firewood stack
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 6; col++) {
        const log = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.2, 7), logMat);
        log.rotation.x = Math.PI / 2;
        log.position.set(
          -houseW / 2 - 0.6 - col * 0.26,
          0.2 + row * 0.26,
          -0.8 + (col % 2) * 0.1
        );
        log.castShadow = true;
        houseGroup.add(log);
      }
    }

    // Chopping block with axe
    const block = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.4, 0.6, 8), logMat);
    block.position.set(-houseW / 2 - 2.2, 0.3, 2.2);
    block.castShadow = true;
    houseGroup.add(block);

    const axe = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.4, 0.2), this.materials.ironMetal);
    axe.position.set(-houseW / 2 - 2.2, 0.68, 2.2);
    houseGroup.add(axe);

    this.scene.add(houseGroup);

    // Colliders
    const mainBox = new THREE.Box3(
      new THREE.Vector3(houseX - houseW / 2 - 0.4, terraceElevation, houseZ - houseD / 2 - 0.4),
      new THREE.Vector3(houseX + houseW / 2 + 0.4, terraceElevation + 8.5, houseZ + houseD / 2 + 0.4)
    );
    this.world.colliders.push({ box: mainBox, mesh: groundFloor, type: 'solid' });

    const porchBox = new THREE.Box3(
      new THREE.Vector3(houseX - porchW / 2, terraceElevation, houseZ + houseD / 2),
      new THREE.Vector3(houseX + porchW / 2, terraceElevation + 0.4, houseZ + houseD / 2 + porchD)
    );
    this.world.colliders.push({ box: porchBox, mesh: porchDeck, type: 'solid' });

    // 6 soft rising smoke puffs
    const smokeMat = new THREE.MeshLambertMaterial({
      color: 0xe2e8f0,
      transparent: true,
      opacity: 0.45,
      flatShading: true
    });
    for (let s = 0; s < 6; s++) {
      const puff = new THREE.Mesh(new THREE.DodecahedronGeometry(0.4 + s * 0.15, 1), smokeMat);
      puff.position.copy(this.chimneySmokeOrigin);
      puff.position.y += s * 0.8;
      this.scene.add(puff);
      this.smokeParticles.push({
        mesh: puff,
        baseY: this.chimneySmokeOrigin.y,
        offset: s * 1.2
      });
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

      // Soil bed
      const soilBed = new THREE.Mesh(new THREE.BoxGeometry(w, 0.16, d), soilMat);
      soilBed.position.set(0, 0.08, 0);
      soilBed.receiveShadow = true;
      paddockGroup.add(soilBed);

      // 4 distinct 3D furrow mounds
      const furrowCount = 4;
      const furrowSpacing = (d - 2.2) / (furrowCount - 1);
      for (let f = 0; f < furrowCount; f++) {
        const fZ = -d / 2 + 1.1 + f * furrowSpacing;
        const furrow = new THREE.Mesh(
          new THREE.CylinderGeometry(0.38, 0.5, w - 1.4, 10),
          soilMat
        );
        furrow.rotateZ(Math.PI / 2);
        furrow.position.set(0, 0.16, fZ);
        furrow.receiveShadow = true;
        paddockGroup.add(furrow);
      }

      // Split-rail fencing with open gate
      const postGeo = new THREE.CylinderGeometry(0.1, 0.12, 1.1, 7);
      const railGeoX = new THREE.BoxGeometry(w / 2 - 1.2, 0.1, 0.08);
      const railGeoZ = new THREE.BoxGeometry(0.08, 0.1, d - 0.4);

      // North Fence
      const pN1 = new THREE.Mesh(postGeo, logMat); pN1.position.set(-w / 2, 0.55, -d / 2); paddockGroup.add(pN1);
      const pN2 = new THREE.Mesh(postGeo, logMat); pN2.position.set(w / 2, 0.55, -d / 2); paddockGroup.add(pN2);
      const rN = new THREE.Mesh(new THREE.BoxGeometry(w - 0.4, 0.1, 0.08), logMat); rN.position.set(0, 0.65, -d / 2); paddockGroup.add(rN);

      // South Fence (with 2.4m central opening for walking)
      const pS1 = new THREE.Mesh(postGeo, logMat); pS1.position.set(-w / 2, 0.55, d / 2); paddockGroup.add(pS1);
      const pS2 = new THREE.Mesh(postGeo, logMat); pS2.position.set(w / 2, 0.55, d / 2); paddockGroup.add(pS2);
      const pSGateL = new THREE.Mesh(postGeo, logMat); pSGateL.position.set(-1.4, 0.55, d / 2); paddockGroup.add(pSGateL);
      const pSGateR = new THREE.Mesh(postGeo, logMat); pSGateR.position.set(1.4, 0.55, d / 2); paddockGroup.add(pSGateR);

      const rSL = new THREE.Mesh(railGeoX, logMat); rSL.position.set(-w / 4 - 0.7, 0.65, d / 2); paddockGroup.add(rSL);
      const rSR = new THREE.Mesh(railGeoX, logMat); rSR.position.set(w / 4 + 0.7, 0.65, d / 2); paddockGroup.add(rSR);

      // West & East Fences
      const rW = new THREE.Mesh(railGeoZ, logMat); rW.position.set(-w / 2, 0.65, 0); paddockGroup.add(rW);
      const rE = new THREE.Mesh(railGeoZ, logMat); rE.position.set(w / 2, 0.65, 0); paddockGroup.add(rE);

      // Plot Signpost
      const signPost = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 1.3, 6), logMat);
      signPost.position.set(1.8, 0.65, d / 2 + 0.4);
      paddockGroup.add(signPost);

      const signBoard = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.35, 0.08), woodMat);
      signBoard.position.set(1.8, 1.1, d / 2 + 0.4);
      paddockGroup.add(signBoard);

      this.scene.add(paddockGroup);
    };

    // 1. WEST CARROT FIELD at (-16, -14)
    buildPaddock(-16, -14, 14, 10, 'Carrot Patch', '🥕');
    this.createCarrotCrop(-16, -14, 14, 10, 'carrot_patch');

    // 2. EAST PUMPKIN FIELD at (16, -14)
    buildPaddock(16, -14, 14, 10, 'Pumpkin Patch', '🎃');
    this.createPumpkinCrop(16, -14, 14, 10);

    // 3. SOUTH-WEST GOLDEN WHEAT at (-16, 16)
    buildPaddock(-16, 16, 14, 10, 'Golden Wheat', '🌾');
    this.createWheatCrop(-16, 16, 14, 10);
    this.createScarecrow(-16, 16);

    // 4. SOUTH-EAST VEGETABLE GARDEN at (16, 16)
    buildPaddock(16, 16, 14, 10, 'Kitchen Garden', '🥕');
    this.createCarrotCrop(16, 16, 14, 10, 'kitchen_garden');
  }

  createScarecrow(x, z) {
    const scGroup = new THREE.Group();
    scGroup.position.set(x, 0, z);

    const woodMat = this.materials.timberLog;
    const shirtMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.85, flatShading: true });
    const burlapMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.9, flatShading: true });
    const hatMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.8, flatShading: true });

    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 2.8, 6), woodMat);
    post.position.set(0, 1.4, 0);
    post.castShadow = true;
    scGroup.add(post);

    const arms = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.8, 6), woodMat);
    arms.rotation.z = Math.PI / 2;
    arms.position.set(0, 2.0, 0);
    arms.castShadow = true;
    scGroup.add(arms);

    const shirt = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.85, 0.45), shirtMat);
    shirt.position.set(0, 1.8, 0);
    shirt.castShadow = true;
    scGroup.add(shirt);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 8), burlapMat);
    head.position.set(0, 2.4, 0);
    head.castShadow = true;
    scGroup.add(head);

    const hatBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.05, 8), hatMat);
    hatBrim.position.set(0, 2.55, 0);
    scGroup.add(hatBrim);

    const hatCone = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.45, 8), hatMat);
    hatCone.position.set(0, 2.8, 0);
    hatCone.rotation.z = 0.15;
    scGroup.add(hatCone);

    this.scene.add(scGroup);
  }

  createCarrotCrop(centerX, centerZ, width, depth, prefix = 'carrot') {
    const carrotTopMat = this.materials.leafLight;
    const carrotMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.5, flatShading: true });

    const rows = 4;
    const cols = 5;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = centerX - width / 2 + 1.6 + c * ((width - 3.2) / (cols - 1));
        const z = centerZ - depth / 2 + 1.4 + r * ((depth - 2.8) / (rows - 1));

        const group = new THREE.Group();
        group.position.set(x, 0.22, z);

        const root = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.38, 7), carrotMat);
        root.rotation.x = Math.PI;
        root.position.set(0, 0.12, 0);
        root.castShadow = true;
        group.add(root);

        const foliageGroup = new THREE.Group();
        for (let l = 0; l < 6; l++) {
          const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.065, 0.48, 5), carrotTopMat);
          leaf.position.set(0, 0.28, 0);
          leaf.rotation.z = 0.22 + (l % 2) * 0.1;
          leaf.rotation.y = l * (Math.PI / 3);
          leaf.castShadow = true;
          foliageGroup.add(leaf);
        }
        group.add(foliageGroup);

        this.scene.add(group);

        const cropObj = {
          id: `${prefix}_${r}_${c}`,
          mesh: group,
          foliage: foliageGroup,
          name: 'Carrot Plant',
          prompt: 'Harvest Carrot',
          ready: true,
          growTimer: 0,
          regrowTime: 12.0,
          phaseOffset: x * 0.7 + z * 0.5,
          interact: (player) => {
            if (!cropObj.ready) return;
            cropObj.ready = false;
            cropObj.growTimer = cropObj.regrowTime;
            group.scale.set(0.1, 0.1, 0.1);

            player.addToBackpack('carrot', 1);
            sounds.playInteract();

            events.emit('crop:harvested', { type: 'carrot', id: cropObj.id });

            const evt = new CustomEvent('game:message', {
              detail: { message: '🥕 Harvested 1 Sweet Farm Carrot!' }
            });
            window.dispatchEvent(evt);
          },
          update: (dt) => {
            if (!cropObj.ready) {
              cropObj.growTimer -= dt;
              const progress = 1 - (cropObj.growTimer / cropObj.regrowTime);
              const scale = Math.min(1.0, 0.1 + progress * 0.9);
              group.scale.set(scale, scale, scale);

              if (cropObj.growTimer <= 0) {
                cropObj.ready = true;
                group.scale.set(1, 1, 1);
              }
            }
          }
        };

        this.cropPlants.push(cropObj);
        this.interactables.push(cropObj);
        this.animatedFoliage.push(cropObj);
      }
    }
  }

  createPumpkinCrop(centerX, centerZ, width, depth) {
    const pumpkinMat = new THREE.MeshStandardMaterial({ color: 0xea580c, roughness: 0.55, flatShading: true });
    const stemMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.8, flatShading: true });
    const leafMat = this.materials.leafVibrant;

    const rows = 3;
    const cols = 4;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = centerX - width / 2 + 1.8 + c * ((width - 3.6) / (cols - 1)) + (Math.random() - 0.5) * 0.3;
        const z = centerZ - depth / 2 + 1.6 + r * ((depth - 3.2) / (rows - 1)) + (Math.random() - 0.5) * 0.3;

        const group = new THREE.Group();
        group.position.set(x, 0.22, z);

        const bodyGroup = new THREE.Group();
        // Segmented organic pumpkin with ribbed appearance
        const mainSphere = new THREE.Mesh(new THREE.SphereGeometry(0.44, 16, 12), pumpkinMat);
        mainSphere.scale.set(1.18, 0.76, 1.18);
        mainSphere.position.set(0, 0.32, 0);
        mainSphere.castShadow = true;
        bodyGroup.add(mainSphere);

        // Fluted ribbed side lobes
        for (let lobe = 0; lobe < 6; lobe++) {
          const lMesh = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 8), pumpkinMat);
          const lang = (lobe / 6) * Math.PI * 2;
          lMesh.scale.set(0.65, 1.05, 0.65);
          lMesh.position.set(Math.cos(lang) * 0.34, 0.32, Math.sin(lang) * 0.34);
          bodyGroup.add(lMesh);
        }

        // Vine leaves sprawled along soil
        for (let pl = 0; pl < 4; pl++) {
          const pLeaf = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.02, 6), leafMat);
          const lang = (pl / 4) * Math.PI * 2;
          pLeaf.position.set(Math.cos(lang) * 0.46, 0.04, Math.sin(lang) * 0.46);
          pLeaf.rotation.y = lang;
          bodyGroup.add(pLeaf);
        }

        const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.055, 0.22, 6), stemMat);
        stem.position.set(0.03, 0.66, 0);
        stem.rotation.z = 0.25;
        bodyGroup.add(stem);

        group.add(bodyGroup);
        this.scene.add(group);

        const cropObj = {
          id: `pumpkin_${r}_${c}`,
          mesh: group,
          body: bodyGroup,
          name: 'Pumpkin Patch',
          prompt: 'Harvest Pumpkin',
          ready: true,
          growTimer: 0,
          regrowTime: 16.0,
          phaseOffset: x * 0.6 + z * 0.4,
          interact: (player) => {
            if (!cropObj.ready) return;
            cropObj.ready = false;
            cropObj.growTimer = cropObj.regrowTime;
            group.scale.set(0.1, 0.1, 0.1);

            player.addToBackpack('pumpkin', 1);
            sounds.playInteract();

            events.emit('crop:harvested', { type: 'pumpkin', id: cropObj.id });

            const evt = new CustomEvent('game:message', {
              detail: { message: '🎃 Harvested 1 Large Ripe Pumpkin!' }
            });
            window.dispatchEvent(evt);
          },
          update: (dt) => {
            if (!cropObj.ready) {
              cropObj.growTimer -= dt;
              const progress = 1 - (cropObj.growTimer / cropObj.regrowTime);
              const scale = Math.min(1.0, 0.1 + progress * 0.9);
              group.scale.set(scale, scale, scale);

              if (cropObj.growTimer <= 0) {
                cropObj.ready = true;
                group.scale.set(1, 1, 1);
              }
            }
          }
        };

        this.cropPlants.push(cropObj);
        this.interactables.push(cropObj);
      }
    }
  }

  createWheatCrop(centerX, centerZ, width, depth) {
    const wheatMat = this.materials.straw;

    const rows = 4;
    const cols = 5;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = centerX - width / 2 + 1.5 + c * ((width - 3.0) / (cols - 1));
        const z = centerZ - depth / 2 + 1.5 + r * ((depth - 3.0) / (rows - 1));

        const group = new THREE.Group();
        group.position.set(x, 0.22, z);

        const sheafGroup = new THREE.Group();
        for (let s = 0; s < 6; s++) {
          const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.95, 5), wheatMat);
          const angle = (s / 6) * Math.PI * 2;
          const tilt = 0.08 + (s % 2) * 0.04;
          stalk.position.set(Math.cos(angle) * 0.1, 0.47, Math.sin(angle) * 0.1);
          stalk.rotation.z = Math.cos(angle) * tilt;
          stalk.rotation.x = Math.sin(angle) * tilt;
          stalk.castShadow = true;
          sheafGroup.add(stalk);

          const ear = new THREE.Mesh(new THREE.ConeGeometry(0.065, 0.25, 5), wheatMat);
          ear.position.set(Math.cos(angle) * 0.15, 0.95, Math.sin(angle) * 0.15);
          ear.rotation.z = Math.cos(angle) * (tilt + 0.15);
          ear.castShadow = true;
          sheafGroup.add(ear);
        }
        group.add(sheafGroup);

        this.scene.add(group);

        const cropObj = {
          id: `wheat_${r}_${c}`,
          mesh: group,
          foliage: sheafGroup,
          name: 'Wheat Stalks',
          prompt: 'Harvest Wheat',
          ready: true,
          growTimer: 0,
          regrowTime: 14.0,
          phaseOffset: x * 0.8 + z * 0.6,
          interact: (player) => {
            if (!cropObj.ready) return;
            cropObj.ready = false;
            cropObj.growTimer = cropObj.regrowTime;
            group.scale.set(0.1, 0.1, 0.1);

            player.addToBackpack('wheat', 1);
            sounds.playInteract();

            events.emit('crop:harvested', { type: 'wheat', id: cropObj.id });

            const evt = new CustomEvent('game:message', {
              detail: { message: '🌾 Harvested 1 Golden Wheat Bundle!' }
            });
            window.dispatchEvent(evt);
          },
          update: (dt) => {
            if (!cropObj.ready) {
              cropObj.growTimer -= dt;
              const progress = 1 - (cropObj.growTimer / cropObj.regrowTime);
              const scale = Math.min(1.0, 0.1 + progress * 0.9);
              group.scale.set(scale, scale, scale);

              if (cropObj.growTimer <= 0) {
                cropObj.ready = true;
                group.scale.set(1, 1, 1);
              }
            }
          }
        };

        this.cropPlants.push(cropObj);
        this.interactables.push(cropObj);
        this.animatedFoliage.push(cropObj);
      }
    }
  }

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


    // 2. SLENDER BIRCH TREES
    // Grouped into picturesque natural copses framing knolls and meadows
    const birchLocations = [
      // Terrace hillside copses (framing chalet knoll)
      { x: -16.5, z: -27.0, h: 5.2 },
      { x: -19.5, z: -29.5, h: 4.8 },
      { x: 16.5,  z: -27.0, h: 5.0 },
      { x: 19.5,  z: -29.5, h: 5.4 },
      // Scenic northern forest knoll copses
      { x: -14.0, z: -43.0, h: 5.3 },
      { x: -17.5, z: -45.0, h: 4.7 },
      { x: 14.0,  z: -43.0, h: 5.1 },
      { x: 18.0,  z: -44.5, h: 5.5 },
      // West well plaza shaded copse
      { x: -22.5, z: -7.0,  h: 4.9 },
      { x: -25.0, z: -9.5,  h: 5.2 },
      // South meadow entrance framing copse
      { x: -18.5, z: 27.0,  h: 5.0 },
      { x: 18.5,  z: 27.0,  h: 5.2 }
    ];

    birchLocations.forEach(bl => {
      const bGroup = new THREE.Group();
      bGroup.position.set(bl.x, 0, bl.z);

      const bTrunkH = bl.h || 5.0;
      // Slender smooth trunk (16 radial segments, smooth shading)
      const bTrunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.25, bTrunkH, 16), this.materials.birchTrunk);
      bTrunk.position.set(0, bTrunkH / 2, 0);
      bTrunk.castShadow = true;
      bGroup.add(bTrunk);

      for (let r = 0; r < 5; r++) {
        const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.185, 0.185, 0.08, 16), this.materials.birchSpots);
        ring.position.set(0, 0.9 + r * 0.9, 0);
        bGroup.add(ring);
      }

      // Slender branching limb
      const bLimb = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 1.3, 10), this.materials.birchTrunk);
      bLimb.position.set(0.35, 3.2, 0.15);
      bLimb.rotation.z = -0.7;
      bGroup.add(bLimb);

      // Smooth Rounded Foliage Clusters (delicate weeping birch canopy)
      const c1 = new THREE.Mesh(new THREE.SphereGeometry(1.35, 20, 16), this.materials.birchLeaf);
      c1.position.set(-0.35, 3.8, 0.2);
      c1.castShadow = true;
      bGroup.add(c1);

      const c2 = new THREE.Mesh(new THREE.SphereGeometry(1.45, 20, 16), this.materials.birchLeaf);
      c2.position.set(0.45, 4.3, -0.2);
      c2.castShadow = true;
      bGroup.add(c2);

      const c3 = new THREE.Mesh(new THREE.SphereGeometry(1.2, 20, 16), this.materials.leafSun);
      c3.position.set(0.05, 5.2, 0.05);
      c3.castShadow = true;
      bGroup.add(c3);

      this.scene.add(bGroup);

      // Accurate radial cylinder collider + matching AABB
      const bRadius = 0.26;
      this.world.addCylinderCollider(bl.x, bl.z, bRadius, bTrunkH);
      const bBox = new THREE.Box3(
        new THREE.Vector3(bl.x - bRadius, 0, bl.z - bRadius),
        new THREE.Vector3(bl.x + bRadius, bTrunkH, bl.z + bRadius)
      );
      this.world.colliders.push({ box: bBox, mesh: bTrunk, type: 'solid', isCylinder: true });
    });

    // 3. TIERED ALPINE PINES / FIRS
    // Dense, layered evergreen forest belt naturally framing valley perimeter
    const pineLocations = [
      // North mountain boundary forest (behind farmhouse knoll)
      { x: -28, z: -52, h: 8.5 }, { x: -22, z: -54, h: 9.2 }, { x: -15, z: -51, h: 7.8 },
      { x: 0,   z: -54, h: 9.0 }, { x: 15,  z: -51, h: 8.0 }, { x: 22,  z: -54, h: 9.5 }, { x: 28, z: -52, h: 8.2 },
      // East foothill forest belt
      { x: 44, z: -30, h: 8.0 }, { x: 47, z: -22, h: 9.0 }, { x: 45, z: -12, h: 7.6 },
      { x: 48, z: 2,   h: 8.8 }, { x: 44, z: 14,  h: 7.9 }, { x: 47, z: 26,  h: 8.5 },
      // South valley entrance woodlands
      { x: -32, z: 46, h: 8.2 }, { x: -24, z: 49, h: 9.0 }, { x: -14, z: 46, h: 7.5 },
      { x: 14,  z: 46, h: 7.8 }, { x: 24,  z: 49, h: 9.2 }, { x: 32,  z: 46, h: 8.4 },
      // West garden & ridge forest belt
      { x: -44, z: -28, h: 8.2 }, { x: -48, z: -18, h: 9.1 }, { x: -45, z: -6,  h: 7.8 },
      { x: -48, z: 8,   h: 8.7 }, { x: -44, z: 20,  h: 7.9 }, { x: -47, z: 32,  h: 8.6 }
    ];

    pineLocations.forEach(p => {
      const pineGroup = new THREE.Group();
      pineGroup.position.set(p.x, 0, p.z);

      const pTrunkH = p.h || 7.5;
      // Sturdy smooth conifer trunk (16 radial segments, smooth shading)
      const pTrunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.44, pTrunkH, 16), trunkMat);
      pTrunk.position.set(0, pTrunkH / 2, 0);
      pTrunk.castShadow = true;
      pineGroup.add(pTrunk);

      // Smooth Tiered Conical Boughs (20 radial segments with smooth shading)
      const tiers = 4;
      for (let tier = 0; tier < tiers; tier++) {
        const tierH = 2.4 - tier * 0.35;
        const tierR = 2.6 - tier * 0.45;
        const bough = new THREE.Mesh(new THREE.ConeGeometry(tierR, tierH, 20), this.materials.leafPine);
        bough.position.set(0, 3.2 + tier * 1.3, 0);
        bough.castShadow = true;
        pineGroup.add(bough);
      }

      this.scene.add(pineGroup);

      // Accurate radial cylinder collider + matching AABB for every pine tree
      const pRadius = 0.42;
      this.world.addCylinderCollider(p.x, p.z, pRadius, pTrunkH);
      const pBox = new THREE.Box3(
        new THREE.Vector3(p.x - pRadius, 0, p.z - pRadius),
        new THREE.Vector3(p.x + pRadius, pTrunkH, p.z + pRadius)
      );
      this.world.colliders.push({ box: pBox, mesh: pTrunk, type: 'solid', isCylinder: true });
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

    const stoneMat = this.materials.stoneWall;
    const woodMat = this.materials.wood;

    const wellBase = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.5, 0.95, 16), stoneMat);
    wellBase.position.set(0, 0.47, 0);
    wellBase.castShadow = true;
    wellBase.receiveShadow = true;
    group.add(wellBase);

    const water = new THREE.Mesh(
      new THREE.CylinderGeometry(1.2, 1.2, 0.1, 14),
      new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.1, metalness: 0.3 })
    );
    water.position.set(0, 0.75, 0);
    group.add(water);

    const postG = new THREE.CylinderGeometry(0.1, 0.1, 2.3, 7);
    const p1 = new THREE.Mesh(postG, woodMat); p1.position.set(-1.1, 1.4, 0); group.add(p1);
    const p2 = new THREE.Mesh(postG, woodMat); p2.position.set(1.1, 1.4, 0); group.add(p2);

    const roofG = new THREE.ConeGeometry(1.8, 1.1, 4);
    roofG.rotateY(Math.PI / 4);
    const roof = new THREE.Mesh(roofG, this.materials.roof);
    roof.position.set(0, 2.9, 0);
    roof.castShadow = true;
    group.add(roof);

    const bucket = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.16, 0.35, 7), woodMat);
    bucket.position.set(0, 1.4, 0);
    group.add(bucket);

    this.scene.add(group);

    const wellBox = new THREE.Box3(
      new THREE.Vector3(x - 1.5, 0, z - 1.5),
      new THREE.Vector3(x + 1.5, 1.2, z + 1.5)
    );
    this.world.colliders.push({ box: wellBox, mesh: wellBase, type: 'solid' });

    // Interactive Stone Well for refilling Watering Can
    this.interactables.push({
      id: 'stone_well',
      mesh: wellBase,
      name: 'Stone Well',
      prompt: 'Refill Watering Can',
      ready: true,
      interact: (player) => {
        if (player.farmingManager) {
          player.farmingManager.refillWateringCan();
        }
      }
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

    tuftLocations.forEach(tl => {
      const tuftGroup = new THREE.Group();
      tuftGroup.position.set(tl.x, 0.02, tl.z);

      for (let b = 0; b < 5; b++) {
        const blade = new THREE.Mesh(new THREE.ConeGeometry(0.06 * tl.scale, 0.55 * tl.scale, 4), grassBladeMat);
        const rotY = (b / 5) * Math.PI * 2;
        blade.position.set(Math.cos(rotY) * 0.08, 0.28 * tl.scale, Math.sin(rotY) * 0.08);
        blade.rotation.y = rotY;
        blade.rotation.z = 0.24;
        tuftGroup.add(blade);
      }
      this.scene.add(tuftGroup);
    });

    // 2. Smooth Shrubbery & Garden Bushes (Lush, rounded organic shrub clusters)
    const bushPositions = [
      { x: -12.5, z: -21 }, { x: 12.5, z: -21 },
      { x: -5.5, z: -21 }, { x: 5.5, z: -21 },
      { x: -6, z: -5 }, { x: 6, z: -5 },
      { x: -6, z: 8 }, { x: 6, z: 8 },
      { x: 17, z: -3 }, { x: 29, z: -3 },
      { x: -22, z: 2 }, { x: -22, z: 12 }
    ];

    bushPositions.forEach(bp => {
      const bGroup = new THREE.Group();
      bGroup.position.set(bp.x, 0, bp.z);

      const b1 = new THREE.Mesh(new THREE.SphereGeometry(0.85, 18, 14), bushMat);
      b1.position.set(0, 0.65, 0);
      b1.castShadow = true;
      bGroup.add(b1);

      const b2 = new THREE.Mesh(new THREE.SphereGeometry(0.65, 18, 14), this.materials.leafLight);
      b2.position.set(0.35, 0.78, 0.25);
      b2.castShadow = true;
      bGroup.add(b2);

      this.scene.add(bGroup);
    });
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
