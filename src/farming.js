import * as THREE from 'three';
import { sounds } from './audio.js';
import { events } from './events.js';
import { assetPipeline } from './assetPipeline.js';

/**
 * Authoritative Data-Driven Crop Definitions
 */
export const CROPS = {
  carrot: {
    id: 'carrot',
    name: 'Carrot',
    seedId: 'seed_carrot',
    seedName: 'Carrot Seeds',
    icon: '🥕',
    growthDays: 2,
    yield: 2,
    regrows: false,
    staminaHarvest: 2,
    description: 'Crisp organic carrot. Quick to grow and hardy.'
  },
  wheat: {
    id: 'wheat',
    name: 'Wheat',
    seedId: 'seed_wheat',
    seedName: 'Wheat Seeds',
    icon: '🌾',
    growthDays: 3,
    yield: 3,
    regrows: false,
    staminaHarvest: 2,
    description: 'Golden field wheat used for flour and feed.'
  },
  pumpkin: {
    id: 'pumpkin',
    name: 'Country Pumpkin',
    seedId: 'seed_pumpkin',
    seedName: 'Pumpkin Seeds',
    icon: '🎃',
    growthDays: 4,
    yield: 1,
    regrows: false,
    staminaHarvest: 3,
    description: 'Heirloom giant pumpkin. Takes longer to mature.'
  },
  tomato: {
    id: 'tomato',
    name: 'Juicy Tomato',
    seedId: 'seed_tomato',
    seedName: 'Tomato Seeds',
    icon: '🍅',
    growthDays: 3,
    yield: 3,
    regrows: true,
    regrowthDays: 2,
    staminaHarvest: 2,
    description: 'Sweet garden tomato. Produces continuous harvests once mature.'
  }
};

export const TOOLS = [
  { id: 'hoe', name: 'Field Hoe', key: '1', icon: '⛏️', staminaCost: 8 },
  { id: 'water_can', name: 'Watering Can', key: '2', icon: '💧', staminaCost: 4 },
  { id: 'seed_pouch', name: 'Seed Pouch', key: '3', icon: '🌱', staminaCost: 2 },
  { id: 'sickle', name: 'Harvest Sickle', key: '4', icon: '🌾', staminaCost: 5 }
];

export class FarmingManager {
  constructor(scene, collisionWorld, particleManager, timeManager) {
    this.scene = scene;
    this.collisionWorld = collisionWorld;
    this.particles = particleManager;
    this.timeManager = timeManager;

    // 1x1 Meter Farming Grid Map: key -> tileData
    this.tiles = new Map();

    // Tools & Equipment State
    this.activeToolIndex = 0; // 0: Hoe, 1: Watering Can, 2: Seed Pouch, 3: Sickle
    this.selectedCropId = 'carrot'; // 'carrot' | 'wheat' | 'pumpkin' | 'tomato'
    this.wateringCanMax = 12;
    this.wateringCanCurrent = 12;

    // Raycast interaction state
    this.raycaster = new THREE.Raycaster();
    this.raycaster.far = 5.0;
    this.targetedTile = null; // { gx, gz, worldPos, valid, reason }
    this.groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

    // Tutorial Progression State (1 to 7)
    this.tutorial = {
      step: 1,
      completed: false,
      skipped: false
    };

    // Blender 3D Model Templates & State
    this.assetsLoaded = false;
    this.soilTemplate = null;
    this.carrotStageTemplates = new Map(); // 1, 2, 3, 4 -> mesh template

    // Shared Materials
    this.initMaterials();

    // Visual Grid Selector Box
    this.createSelectorMesh();

    // Group for all farming tile meshes
    this.farmingGroup = new THREE.Group();
    this.farmingGroup.name = 'FarmingSystem';
    this.scene.add(this.farmingGroup);

    // Seed replenishment bin mesh near farmhouse knoll
    this.createEmergencySeedSupply();

    // Bind Day Rollover and Hour listener for TimeManager-driven growth
    this.setupTimeListener();

    // Asynchronously load handcrafted Blender farming assets
    this.loadBlenderAssets();
  }

  initMaterials() {
    // Soil textures
    const dryCanvas = document.createElement('canvas');
    dryCanvas.width = 128; dryCanvas.height = 128;
    const dCtx = dryCanvas.getContext('2d');
    dCtx.fillStyle = '#6b4423';
    dCtx.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 400; i++) {
      dCtx.fillStyle = Math.random() > 0.5 ? '#553417' : '#7c522e';
      dCtx.fillRect(Math.random() * 128, Math.random() * 128, 2, 2);
    }
    const dryTex = new THREE.CanvasTexture(dryCanvas);
    dryTex.wrapS = THREE.RepeatWrapping; dryTex.wrapT = THREE.RepeatWrapping;

    const wetCanvas = document.createElement('canvas');
    wetCanvas.width = 128; wetCanvas.height = 128;
    const wCtx = wetCanvas.getContext('2d');
    wCtx.fillStyle = '#2c1a0c';
    wCtx.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 500; i++) {
      wCtx.fillStyle = Math.random() > 0.5 ? '#201308' : '#3a2312';
      wCtx.fillRect(Math.random() * 128, Math.random() * 128, 2, 2);
    }
    const wetTex = new THREE.CanvasTexture(wetCanvas);
    wetTex.wrapS = THREE.RepeatWrapping; wetTex.wrapT = THREE.RepeatWrapping;

    this.materials = {
      // PBR Non-Metallic Soil Materials with organic texture & vertex color support
      drySoil: new THREE.MeshStandardMaterial({
        map: dryTex,
        color: 0xd6b89c,
        roughness: 0.94,
        metalness: 0.0,
        dithering: true
      }),
      wateredSoil: new THREE.MeshStandardMaterial({
        map: wetTex,
        color: 0x6e5239, // Softly darkened saturated humus with subtle moisture sheen
        roughness: 0.72,
        metalness: 0.0,
        dithering: true
      }),
      soilFurrow: new THREE.MeshStandardMaterial({
        color: 0x4a2e16,
        roughness: 0.95,
        metalness: 0.0
      }),
      selectorValid: new THREE.MeshBasicMaterial({
        color: 0x22c55e,
        transparent: true,
        opacity: 0.18,
        depthWrite: false,
        side: THREE.DoubleSide
      }),
      selectorInvalid: new THREE.MeshBasicMaterial({
        color: 0xef4444,
        transparent: true,
        opacity: 0.08,
        depthWrite: false,
        side: THREE.DoubleSide
      }),
      selectorBorderValid: new THREE.LineBasicMaterial({
        color: 0x4ade80,
        transparent: true,
        opacity: 0.75
      }),
      selectorBorderInvalid: new THREE.LineBasicMaterial({
        color: 0xf87171,
        transparent: true,
        opacity: 0.55
      }),
      // Crop Foliage & Produce Materials
      leafSprout: new THREE.MeshStandardMaterial({ color: 0x68d391, roughness: 0.65 }),
      leafGreen: new THREE.MeshStandardMaterial({ color: 0x2f855a, roughness: 0.7 }),
      leafLush: new THREE.MeshStandardMaterial({ color: 0x22543d, roughness: 0.75 }),
      carrotOrange: new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.45 }),
      wheatGreen: new THREE.MeshStandardMaterial({ color: 0x48bb78, roughness: 0.7 }),
      wheatRipe: new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.65 }),
      pumpkinOrange: new THREE.MeshStandardMaterial({ color: 0xea580c, roughness: 0.55 }),
      pumpkinStem: new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.8 }),
      tomatoRed: new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.35, metalness: 0.05 }),
      tomatoUnripe: new THREE.MeshStandardMaterial({ color: 0x84cc16, roughness: 0.45 }),
      woodStake: new THREE.MeshStandardMaterial({ color: 0x54371e, roughness: 0.85 })
    };
  }

  createSelectorMesh() {
    const geo = new THREE.PlaneGeometry(0.96, 0.96);
    this.selectorMesh = new THREE.Mesh(geo, this.materials.selectorValid);
    this.selectorMesh.rotateX(-Math.PI / 2);
    this.selectorMesh.position.set(0, 0.035, 0);
    this.selectorMesh.visible = false;
    this.scene.add(this.selectorMesh);

    // Subtle outline border
    const edges = new THREE.EdgesGeometry(geo);
    this.selectorBorder = new THREE.LineSegments(
      edges,
      this.materials.selectorBorderValid
    );
    this.selectorBorder.rotateX(-Math.PI / 2);
    this.selectorBorder.position.set(0, 0.036, 0);
    this.selectorBorder.visible = false;
    this.scene.add(this.selectorBorder);
  }

  createEmergencySeedSupply() {
    // Rustic Emergency Seed Crate on knoll terrace at (-6.5, 0.6, -25.0)
    const seedBoxGroup = new THREE.Group();
    seedBoxGroup.position.set(-6.5, 0.6, -25.0);

    const boxMat = new THREE.MeshStandardMaterial({ color: 0x6d4c2d, roughness: 0.85 });
    const crate = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.55, 0.7), boxMat);
    crate.position.set(0, 0.275, 0);
    crate.castShadow = true;
    crate.receiveShadow = true;
    seedBoxGroup.add(crate);

    // Sacks of seeds inside crate
    const sackMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.9 });
    const sack1 = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8), sackMat);
    sack1.position.set(-0.2, 0.55, -0.1);
    seedBoxGroup.add(sack1);

    const sack2 = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8), sackMat);
    sack2.position.set(0.2, 0.55, 0.1);
    seedBoxGroup.add(sack2);

    this.scene.add(seedBoxGroup);

    // Register interactable trigger with E
    this.seedSupplyInteractable = {
      id: 'emergency_seed_supply',
      mesh: crate,
      name: 'Seed Bin (Starter Supply)',
      prompt: 'Take Free Seeds',
      ready: true,
      interact: (player) => {
        let addedCount = 0;
        const seedKeys = ['seed_carrot', 'seed_wheat', 'seed_pumpkin', 'seed_tomato'];
        seedKeys.forEach(sId => {
          const current = player.getItemCount(sId);
          if (current < 8) {
            player.addToBackpack(sId, 4);
            addedCount += 4;
          }
        });

        sounds.playInteract();
        const msg = addedCount > 0
          ? `🌱 Replenished +4 each of Carrot, Wheat, Pumpkin & Tomato Seeds!`
          : `🌱 You already have plenty of seeds in your backpack!`;

        const evt = new CustomEvent('game:message', { detail: { message: msg } });
        window.dispatchEvent(evt);
      }
    };
  }

  setupTimeListener() {
    // Listen for daily rollover event emitted by TimeManager
    window.addEventListener('time:dayRollover', (e) => {
      this.handleDayRollover(e.detail);
    });
    events.on('time:day_changed', (detail) => {
      this.handleDayRollover(detail);
    });
    events.on('time:hour_changed', (detail) => {
      this.handleHourChanged(detail);
    });
    window.addEventListener('time:hourChanged', (e) => {
      this.handleHourChanged(e.detail);
    });
  }

  handleHourChanged(detail = {}) {
    if (detail.hour >= 12 || (this.timeManager && this.timeManager.hour >= 12)) {
      this.checkIntradayGrowth();
    }
  }

  /**
   * Asynchronously loads handcrafted Blender 3D assets for farmland and crops
   */
  async loadBlenderAssets() {
    try {
      const [soilRes, carrotRes] = await Promise.all([
        assetPipeline.loadModel('/models/farm_soil_tile.glb', { collision: 'none' }),
        assetPipeline.loadModel('/models/crop_carrot.glb', { collision: 'none' })
      ]);

      // 1. Soil template
      if (soilRes && soilRes.model) {
        soilRes.model.traverse(c => {
          if (c.isMesh) {
            c.castShadow = false;
            c.receiveShadow = true;
            const hasVC = !!(c.geometry && c.geometry.attributes && c.geometry.attributes.color);
            this.materials.drySoil.vertexColors = hasVC;
            this.materials.wateredSoil.vertexColors = hasVC;
            this.materials.drySoil.needsUpdate = true;
            this.materials.wateredSoil.needsUpdate = true;
            c.material = this.materials.drySoil;
          }
        });
        this.soilTemplate = soilRes.model;
      }

      // 2. Carrot stage templates
      if (carrotRes && carrotRes.model) {
        carrotRes.model.traverse(c => {
          if (c.isMesh) {
            c.castShadow = true;
            c.receiveShadow = true;
            if (c.material) {
              c.material.vertexColors = true;
              c.material.side = THREE.DoubleSide;
              c.material.roughness = 0.58;
              c.material.metalness = 0.0;
              c.material.dithering = true;
            }
            if (c.name.includes('stage_01')) this.carrotStageTemplates.set(1, c);
            else if (c.name.includes('stage_02')) this.carrotStageTemplates.set(2, c);
            else if (c.name.includes('stage_03')) this.carrotStageTemplates.set(3, c);
            else if (c.name.includes('stage_04')) this.carrotStageTemplates.set(4, c);
          }
        });
      }

      this.assetsLoaded = true;
      console.log('🌾 [FarmingManager] Blender farming assets loaded (Soil + 4-Stage Carrot)!');

      // Refresh any tiles placed before async loading completed
      this.refreshAllVisuals();
    } catch (err) {
      console.warn('⚠️ [FarmingManager] Blender assets load failed, using procedural fallbacks:', err);
    }
  }

  /**
   * Re-evaluates and upgrades mesh representation on all active tiles once models load
   */
  refreshAllVisuals() {
    this.tiles.forEach(tile => {
      if (this.soilTemplate && (!tile.soilMesh || !tile.soilMesh.userData?.isBlenderModel)) {
        const oldGroup = tile.soilGroup;
        const wasWatered = tile.isWatered;

        // Safely remove only soil mesh and furrows, keeping any cropGroup intact
        if (tile.soilMesh) {
          oldGroup.remove(tile.soilMesh);
        }
        if (tile.furrows && tile.furrows.length > 0) {
          tile.furrows.forEach(f => oldGroup.remove(f));
        }

        const { soilMesh } = this.createSoilBedMesh(wasWatered);
        oldGroup.add(soilMesh);
        tile.soilMesh = soilMesh;
        tile.furrows = [];
      }

      if (tile.crop) {
        this.renderCropMesh(tile);
      }
    });
  }

  /**
   * Builds the connected 3x3 demonstration field in West Homestead arable zone (X in [-8, -6], Z in [1, 3])
   * Showcases all 4 growth stages, dry vs watered soil, and continuous furrow alignment
   */
  createDemoField() {
    const layout = [
      { gx: -8, gz: 1, watered: false, crop: { type: 'carrot', stage: 1, visualStage: 1, daysWatered: 0 } },
      { gx: -7, gz: 1, watered: false, crop: { type: 'carrot', stage: 2, visualStage: 2, daysWatered: 1 } },
      { gx: -6, gz: 1, watered: false, crop: { type: 'carrot', stage: 2, visualStage: 3, daysWatered: 1 } },
      { gx: -8, gz: 2, watered: false, crop: { type: 'carrot', stage: 4, visualStage: 4, daysWatered: 2 } },
      { gx: -7, gz: 2, watered: false, crop: { type: 'carrot', stage: 4, visualStage: 4, daysWatered: 2 } },
      { gx: -6, gz: 2, watered: false, crop: { type: 'carrot', stage: 2, visualStage: 3, daysWatered: 1 } },
      { gx: -8, gz: 3, watered: true, crop: null },
      { gx: -7, gz: 3, watered: false, crop: null },
      { gx: -6, gz: 3, watered: true, crop: { type: 'carrot', stage: 1, visualStage: 1, daysWatered: 1 } },
    ];

    layout.forEach(({ gx, gz, watered, crop }) => {
      const key = `${gx}_${gz}`;
      if (this.tiles.has(key)) {
        const existing = this.tiles.get(key);
        this.farmingGroup.remove(existing.soilGroup);
        this.tiles.delete(key);
      }

      const { soilGroup, soilMesh, furrows } = this.createSoilBedMesh(watered);
      soilGroup.position.set(gx, 0.0, gz);
      this.farmingGroup.add(soilGroup);

      const tileData = {
        gx,
        gz,
        key,
        isTilled: true,
        isWatered: watered,
        crop: crop ? {
          type: crop.type,
          stage: crop.stage,
          visualStage: crop.visualStage,
          daysWatered: crop.daysWatered,
          plantedDay: this.timeManager?.day || 1
        } : null,
        soilGroup,
        soilMesh,
        furrows,
        cropGroup: null
      };

      this.tiles.set(key, tileData);
      if (tileData.crop) {
        this.renderCropMesh(tileData);
      }
    });

    console.log(`🌾 [FarmingManager] Populated 3x3 demonstration field in West Homestead arable zone (${layout.length} tiles).`);
  }

  /**
   * Evaluates if a 1x1m grid tile can be tilled into farmland
   * @param {number} gx Grid X coordinate
   * @param {number} gz Grid Z coordinate
   * @returns {{ valid: boolean, reason?: string }}
   */
  canTill(gx, gz) {
    // 1. Boundary of explorable meadow (-70 to 70m)
    if (Math.abs(gx) > 70 || Math.abs(gz) > 70) {
      return { valid: false, reason: 'Outside farm territory' };
    }

    // 2. Main cobblestone road / avenue (X in [-2.6, 2.6], Z in [-25, 34])
    if (Math.abs(gx) <= 2.6 && gz >= -25 && gz <= 34) {
      return { valid: false, reason: 'Cannot till on stone lane' };
    }

    // 3. Cross-Lanes
    if (Math.abs(gz - (-8)) <= 2.2 && ((gx >= 0 && gx <= 38) || (gx >= -36 && gx <= 0))) {
      return { valid: false, reason: 'Cannot till on cross-lane' };
    }

    // 4. Homestead knoll terrace & chalet (Z <= -22, |X| <= 15)
    if (gz <= -22 && Math.abs(gx) <= 15) {
      return { valid: false, reason: 'Cannot till on homestead terrace' };
    }

    // 5. Stone Well Plaza (around x: -16, z: -8, radius 2.6m)
    const distToWell = Math.hypot(gx - (-16), gz - (-8));
    if (distToWell < 2.6) {
      return { valid: false, reason: 'Cannot till near stone well' };
    }

    // 6. Proximity to tree trunks (avoid clipping tree cylinders)
    if (this.collisionWorld && this.collisionWorld.cylinders) {
      for (const cyl of this.collisionWorld.cylinders) {
        const d = Math.hypot(gx - cyl.x, gz - cyl.z);
        if (d < cyl.radius + 0.6) {
          return { valid: false, reason: 'Blocked by tree roots' };
        }
      }
    }

    // 6.5. Collision obstacles (fence posts, buildings, scarecrow, signposts)
    if (this.collisionWorld && this.collisionWorld.colliders) {
      const tileBox = new THREE.Box3(
        new THREE.Vector3(gx - 0.45, 0.08, gz - 0.45),
        new THREE.Vector3(gx + 0.45, 2.0, gz + 0.45)
      );
      for (const col of this.collisionWorld.colliders) {
        if (!col.box) continue;
        // Skip ground plane and perimeter barrier walls
        if (col.type === 'ground' || col.box.max.y <= 0.08) continue;
        const width = col.box.max.x - col.box.min.x;
        const depth = col.box.max.z - col.box.min.z;
        if (width >= 80 || depth >= 80) continue; // Boundary wall

        if (tileBox.intersectsBox(col.box)) {
          return { valid: false, reason: 'Blocked by obstacle' };
        }
      }
    }

    // 7. Strictly enforce designated Arable Farming Zones in Meadow Valley
    // (Restricts tilling on mountains, paths, knolls, forests, and wild meadows)
    const inArableZone = (
      // Zone 1: West Homestead Arable Field (Kitchen Garden & Tutorial field)
      (gx >= -10 && gx <= -4 && gz >= -2 && gz <= 10) ||
      // Zone 2: South-West Farm Field Paddock
      (gx >= -22 && gx <= -10 && gz >= 11 && gz <= 21) ||
      // Zone 3: North-West Farm Field Paddock
      (gx >= -22 && gx <= -10 && gz >= -19 && gz <= -9) ||
      // Zone 4: South-East Farm Field Paddock
      (gx >= 10 && gx <= 22 && gz >= 11 && gz <= 21) ||
      // Zone 5: North-East Farm Field Paddock
      (gx >= 10 && gx <= 22 && gz >= -19 && gz <= -9) ||
      // Zone 6: East Homestead Arable Field
      (gx >= 4 && gx <= 10 && gz >= -2 && gz <= 10)
    );

    if (!inArableZone) {
      return { valid: false, reason: 'Unsuitable soil — Only marked arable fields can be tilled' };
    }

    // 8. Already occupied by a tilled tile
    const key = `${gx}_${gz}`;
    if (this.tiles.has(key)) {
      return { valid: false, reason: 'Tile is already tilled' };
    }

    return { valid: true };
  }

  /**
   * Intraday growth evaluation: advances crops to intermediate cosmetic stages at midday
   * (e.g. carrot peeking orange shoulder at 12:00 PM without altering authoritative harvest readiness)
   */
  checkIntradayGrowth() {
    if (!this.timeManager) return;
    const hour = this.timeManager.hour;
    if (hour < 12) return;

    let growthOccurred = false;
    this.tiles.forEach(tile => {
      if (tile.crop && tile.crop.type === 'carrot') {
        // Only advance to visual stage 3 if already watered for at least 1 day and not yet ripe
        if (tile.crop.daysWatered >= 1 && tile.crop.stage < 4) {
          const curVisual = tile.crop.visualStage || tile.crop.stage || 1;
          if (curVisual < 3) {
            tile.crop.visualStage = 3;
            this.renderCropMesh(tile);
            growthOccurred = true;
          }
        }
      }
    });

    if (growthOccurred) {
      events.emit('farming:intraday_growth');
    }
  }

  /**
   * Raycast from player camera to target the active 1x1m tile
   */
  updateTargeting(player) {
    if (!player || !player.camera) return;

    // Check for midday intraday visual growth
    this.checkIntradayGrowth();

    const origin = new THREE.Vector3();
    player.camera.getWorldPosition(origin);
    const direction = new THREE.Vector3();
    player.camera.getWorldDirection(direction);

    this.raycaster.set(origin, direction);

    // Intersect horizontal ground plane at Y = 0
    const hitPoint = new THREE.Vector3();
    const hasHit = this.raycaster.ray.intersectPlane(this.groundPlane, hitPoint);

    if (hasHit && origin.distanceTo(hitPoint) <= 4.8) {
      const gx = Math.round(hitPoint.x);
      const gz = Math.round(hitPoint.z);
      const key = `${gx}_${gz}`;
      const existingTile = this.tiles.get(key);

      const activeTool = TOOLS[this.activeToolIndex];
      let valid = true;
      let promptText = '';
      let actionType = 'none';
      let reason = '';

      if (activeTool.id === 'hoe') {
        if (existingTile) {
          valid = false;
          promptText = 'Tile is already tilled';
          reason = 'Tile is already tilled';
        } else {
          const check = this.canTill(gx, gz);
          valid = check.valid;
          promptText = valid ? '[LMB] Till Farmland (8 Stamina)' : (check.reason || 'Cannot till here');
          reason = valid ? '' : (check.reason || 'Cannot till here');
          actionType = 'till';
        }
      } else if (activeTool.id === 'water_can') {
        if (!existingTile) {
          valid = false;
          promptText = 'Till soil before watering';
          reason = 'Till soil before watering';
        } else if (existingTile.isWatered) {
          valid = false;
          promptText = 'Soil is already watered today';
          reason = 'Soil is already watered today';
        } else if (this.wateringCanCurrent <= 0) {
          valid = false;
          promptText = '💧 Watering Can is Empty! Refill at Well [E]';
          reason = 'Watering can is empty! Refill at Well [E]';
        } else {
          valid = true;
          promptText = `[LMB] Water Soil (💧 ${this.wateringCanCurrent}/${this.wateringCanMax})`;
          actionType = 'water';
        }
      } else if (activeTool.id === 'seed_pouch') {
        const cropDef = CROPS[this.selectedCropId];
        const seedCount = player.getItemCount(cropDef.seedId);

        if (!existingTile) {
          valid = false;
          promptText = 'Till soil before planting';
          reason = 'Till soil before planting';
        } else if (existingTile.crop) {
          valid = false;
          promptText = `Tile occupied by ${CROPS[existingTile.crop.type]?.name || 'crop'}`;
          reason = `Tile occupied by ${CROPS[existingTile.crop.type]?.name || 'crop'}`;
        } else if (seedCount <= 0) {
          valid = false;
          promptText = `No ${cropDef.seedName} in backpack! [Take free seeds at crate]`;
          reason = `No ${cropDef.seedName} in backpack! Take free seeds at crate`;
        } else {
          valid = true;
          promptText = `[LMB] Plant ${cropDef.name} (Seeds: ${seedCount})`;
          actionType = 'plant';
        }
      } else if (activeTool.id === 'sickle') {
        if (!existingTile) {
          valid = false;
          promptText = 'Nothing to clear';
          reason = 'Nothing to clear';
        } else {
          valid = true;
          promptText = existingTile.crop
            ? `[LMB] Clear Crop (${CROPS[existingTile.crop.type]?.name || 'Crop'})`
            : '[LMB] Clear Tilled Soil';
          actionType = 'sickle';
        }
      }

      // If tile has a ripe crop ready for harvest, prompt E
      if (existingTile && existingTile.crop && existingTile.crop.stage === 4) {
        const ripeCropDef = CROPS[existingTile.crop.type];
        promptText = `[E] Harvest Ripe ${ripeCropDef.name}!`;
      }

      this.targetedTile = {
        gx,
        gz,
        key,
        worldPos: new THREE.Vector3(gx, 0.035, gz),
        existingTile,
        valid,
        promptText,
        actionType,
        reason
      };

      // Update visual selector
      this.selectorMesh.position.set(gx, 0.035, gz);
      this.selectorMesh.material = valid ? this.materials.selectorValid : this.materials.selectorInvalid;
      this.selectorMesh.visible = true;

      this.selectorBorder.position.set(gx, 0.036, gz);
      this.selectorBorder.material = valid ? this.materials.selectorBorderValid : this.materials.selectorBorderInvalid;
      this.selectorBorder.visible = true;
    } else {
      this.targetedTile = null;
      this.selectorMesh.visible = false;
      this.selectorBorder.visible = false;
    }
  }

  /**
   * Executes the active tool action on the currently targeted tile
   * @param {Player} player 
   * @returns {boolean} Success
   */
  useActiveTool(player) {
    if (!this.targetedTile) return false;
    const { gx, gz, key, valid, actionType, existingTile, reason } = this.targetedTile;
    const activeTool = TOOLS[this.activeToolIndex];

    // Check stamina
    if (player.stamina < activeTool.staminaCost) {
      player.isExhausted = true;
      const evt = new CustomEvent('game:message', {
        detail: { message: '⚡ Too exhausted! Rest to regain stamina.' }
      });
      window.dispatchEvent(evt);
      return false;
    }

    if (!valid && actionType !== 'harvest') {
      const msg = reason || (actionType === 'till' ? 'Cannot till here' : 'Invalid farming action');
      const evt = new CustomEvent('game:message', {
        detail: { message: `⚠️ ${msg}` }
      });
      window.dispatchEvent(evt);
      if (sounds.playActionFailed) {
        sounds.playActionFailed();
      }
      return false;
    }

    if (actionType === 'till') {
      return this.tillTile(gx, gz, player);
    } else if (actionType === 'water') {
      return this.waterTile(existingTile, player);
    } else if (actionType === 'plant') {
      return this.plantCrop(existingTile, this.selectedCropId, player);
    } else if (actionType === 'sickle') {
      return this.clearTile(existingTile, player);
    }

    return false;
  }

  /**
   * Helper to construct a clean, aligned 1x1m raised soil bed with seamless longitudinal furrows
   */
  createSoilBedMesh(isWatered = false) {
    const soilGroup = new THREE.Group();

    let soilMesh;
    if (this.soilTemplate) {
      soilMesh = this.soilTemplate.clone(true);
      soilMesh.userData = { isBlenderModel: true };
      soilMesh.traverse(child => {
        if (child.isMesh) {
          child.material = isWatered ? this.materials.wateredSoil : this.materials.drySoil;
          child.receiveShadow = true;
          child.castShadow = false;
        }
      });
      soilMesh.position.set(0, 0, 0);
    } else {
      // Clean flat 1.0x1.0m fallback box
      soilMesh = new THREE.Mesh(
        new THREE.BoxGeometry(1.0, 0.035, 1.0),
        isWatered ? this.materials.wateredSoil : this.materials.drySoil
      );
      soilMesh.position.set(0, 0.0175, 0);
      soilMesh.receiveShadow = true;
    }
    soilGroup.add(soilMesh);

    return { soilGroup, soilMesh, furrows: [] };
  }

  /**
   * Till grass into farmland
   */
  tillTile(gx, gz, player) {
    const key = `${gx}_${gz}`;
    if (this.tiles.has(key)) return false;

    // Drain stamina
    player.stamina = Math.max(0, player.stamina - 8);

    // Create clean 1x1m soil bed mesh aligned to grid
    const { soilGroup, soilMesh, furrows } = this.createSoilBedMesh(false);
    soilGroup.position.set(gx, 0.0, gz);

    this.farmingGroup.add(soilGroup);

    const tileData = {
      gx,
      gz,
      key,
      isTilled: true,
      isWatered: false,
      crop: null,
      soilGroup,
      soilMesh,
      furrows,
      cropGroup: null
    };

    this.tiles.set(key, tileData);

    // Audio & Particle Feedback
    sounds.playInteract();
    if (this.particles) {
      this.particles.emitDirtPuff(new THREE.Vector3(gx, 0.1, gz));
    }

    // Advance tutorial step 2
    if (this.tutorial.step === 2) {
      this.advanceTutorial(3);
    }

    events.emit('farming:tilled', { gx, gz });
    return true;
  }

  /**
   * Water tilled soil or crop
   */
  waterTile(tile, player) {
    if (!tile || tile.isWatered) return false;
    if (this.wateringCanCurrent <= 0) return false;

    // Drain stamina and water charge
    player.stamina = Math.max(0, player.stamina - 4);
    this.wateringCanCurrent = Math.max(0, this.wateringCanCurrent - 1);

    tile.isWatered = true;
    if (tile.soilMesh) {
      tile.soilMesh.material = this.materials.wateredSoil;
      tile.soilMesh.traverse?.(c => { if (c.isMesh) c.material = this.materials.wateredSoil; });
    }
    if (tile.furrows) {
      tile.furrows.forEach(f => f.material = this.materials.wateredSoil);
    }

    sounds.playInteract();
    if (this.particles) {
      this.particles.emitWaterSplash(new THREE.Vector3(tile.gx, 0.08, tile.gz));
    }

    // Advance tutorial step 6
    if (this.tutorial.step === 6) {
      this.advanceTutorial(7);
    }

    events.emit('farming:watered', { gx: tile.gx, gz: tile.gz, waterLeft: this.wateringCanCurrent });
    return true;
  }

  /**
   * Plant seed into empty tilled soil
   */
  plantCrop(tile, cropId, player) {
    if (!tile || tile.crop) return false;
    const cropDef = CROPS[cropId];
    if (!cropDef) return false;

    // Check seed inventory
    if (player.getItemCount(cropDef.seedId) <= 0) {
      return false;
    }

    // Consume seed and stamina
    player.removeFromBackpack(cropDef.seedId, 1);
    player.stamina = Math.max(0, player.stamina - 2);

    tile.crop = {
      type: cropId,
      stage: 1, // Authoritative maturity
      visualStage: 1, // Cosmetic presentation
      daysWatered: 0,
      plantedDay: this.timeManager ? this.timeManager.day : 1
    };

    // Render Stage 1 crop mesh
    this.renderCropMesh(tile);

    sounds.playInteract();
    if (this.particles) {
      this.particles.emitSeedPlant(new THREE.Vector3(tile.gx, 0.05, tile.gz));
    }

    // Advance tutorial step 4
    if (this.tutorial.step === 4) {
      this.advanceTutorial(5);
    }

    events.emit('farming:planted', { gx: tile.gx, gz: tile.gz, crop: cropId });
    return true;
  }

  /**
   * Harvest ripe Stage 4 crop
   */
  harvestCrop(tile, player) {
    if (!tile || !tile.crop || tile.crop.stage !== 4) return false;
    const cropDef = CROPS[tile.crop.type];
    if (!cropDef) return false;

    // Add produce to backpack
    player.addToBackpack(cropDef.id, cropDef.yield);
    player.stamina = Math.max(0, player.stamina - (cropDef.staminaHarvest || 2));

    sounds.playInteract();
    if (this.particles) {
      this.particles.emitHarvestPop(new THREE.Vector3(tile.gx, 0.35, tile.gz));
    }

    const msg = `${cropDef.icon} Harvested ${cropDef.yield} ${cropDef.name}!`;
    const evt = new CustomEvent('game:message', { detail: { message: msg } });
    window.dispatchEvent(evt);

    if (cropDef.regrows) {
      // Regrowing crop (Tomato): returns to Stage 2
      tile.crop.stage = 2;
      tile.crop.daysWatered = 1;
      this.renderCropMesh(tile);
    } else {
      // Single harvest crop: remove crop, preserve tilled soil
      if (tile.cropGroup) {
        tile.soilGroup.remove(tile.cropGroup);
        tile.cropGroup = null;
      }
      tile.crop = null;
    }

    // Advance tutorial step 7 (finish)
    if (this.tutorial.step === 7) {
      this.completeTutorial();
    }

    events.emit('farming:harvested', { crop: cropDef.id, yield: cropDef.yield });
    return true;
  }

  /**
   * Clear tilled tile or remove crop with sickle
   */
  clearTile(tile, player) {
    if (!tile) return false;
    player.stamina = Math.max(0, player.stamina - 5);

    if (tile.cropGroup) {
      tile.soilGroup.remove(tile.cropGroup);
      tile.cropGroup = null;
    }
    this.farmingGroup.remove(tile.soilGroup);
    this.tiles.delete(tile.key);

    sounds.playInteract();
    if (this.particles) {
      this.particles.emitDirtPuff(new THREE.Vector3(tile.gx, 0.1, tile.gz));
    }

    events.emit('farming:cleared', { gx: tile.gx, gz: tile.gz });
    return true;
  }

  /**
   * Refill watering can to maximum at the Stone Well
   */
  refillWateringCan() {
    this.wateringCanCurrent = this.wateringCanMax;
    sounds.playInteract();
    const evt = new CustomEvent('game:message', {
      detail: { message: `💧 Refilled Watering Can (${this.wateringCanCurrent}/${this.wateringCanMax})!` }
    });
    window.dispatchEvent(evt);
    events.emit('farming:refilled', { water: this.wateringCanCurrent });
  }

  /**
   * Advances crop growth stages across daily simulation rollover boundaries
   */
  handleDayRollover(dateDetail = {}) {
    let growthOccurred = false;

    this.tiles.forEach(tile => {
      if (tile.isWatered) {
        if (tile.crop && tile.crop.stage < 4) {
          tile.crop.daysWatered += 1;
          const cropDef = CROPS[tile.crop.type];

          // Determine target stage based on days watered
          let newAuthStage = tile.crop.stage;
          let newVisualStage = tile.crop.visualStage || tile.crop.stage || 1;

          if (tile.crop.type === 'carrot') {
            // Carrot authoritative maturity requires 2 watered days
            if (tile.crop.daysWatered >= 2) {
              newAuthStage = 4;
              newVisualStage = 4;
            } else if (tile.crop.daysWatered >= 1) {
              newAuthStage = 2;
              // On morning rollover after day 1 watered: visual stage 2
              newVisualStage = Math.max(newVisualStage, 2);
            }
          } else if (tile.crop.type === 'wheat') {
            if (tile.crop.daysWatered >= 3) { newAuthStage = 4; newVisualStage = 4; }
            else if (tile.crop.daysWatered >= 2) { newAuthStage = 3; newVisualStage = 3; }
            else { newAuthStage = 2; newVisualStage = 2; }
          } else if (tile.crop.type === 'pumpkin') {
            if (tile.crop.daysWatered >= 4) { newAuthStage = 4; newVisualStage = 4; }
            else if (tile.crop.daysWatered >= 2) { newAuthStage = 3; newVisualStage = 3; }
            else if (tile.crop.daysWatered >= 1) { newAuthStage = 2; newVisualStage = 2; }
          } else if (tile.crop.type === 'tomato') {
            if (tile.crop.daysWatered >= 3) { newAuthStage = 4; newVisualStage = 4; }
            else if (tile.crop.daysWatered >= 2) { newAuthStage = 3; newVisualStage = 3; }
            else { newAuthStage = 2; newVisualStage = 2; }
          }

          // MONOTONIC GROWTH GUARANTEE: visual stage NEVER regresses!
          newVisualStage = Math.max(newVisualStage, tile.crop.visualStage || 1);

          if (newAuthStage !== tile.crop.stage || newVisualStage !== tile.crop.visualStage) {
            tile.crop.stage = newAuthStage;
            tile.crop.visualStage = newVisualStage;
            this.renderCropMesh(tile);
            growthOccurred = true;
          }
        }

        // Daily moisture reset boundary: soil dries out
        tile.isWatered = false;
        if (tile.soilMesh) {
          tile.soilMesh.material = this.materials.drySoil;
          tile.soilMesh.traverse?.(c => { if (c.isMesh) c.material = this.materials.drySoil; });
        }
        if (tile.furrows) {
          tile.furrows.forEach(f => f.material = this.materials.soilFurrow);
        }
      }
    });

    if (growthOccurred) {
      const evt = new CustomEvent('game:message', {
        detail: { message: '🌱 A new day has dawned! Watered crops have grown.' }
      });
      window.dispatchEvent(evt);
    }
  }

  /**
   * Renders the 3D model corresponding to the crop's current stage (1, 2, 3, or 4)
   */
  renderCropMesh(tile) {
    if (!tile || !tile.crop) return;

    if (tile.cropGroup) {
      tile.soilGroup.remove(tile.cropGroup);
      tile.cropGroup = null;
    }

    const group = new THREE.Group();
    const { type, stage, visualStage } = tile.crop;
    const stageNum = visualStage || stage || 1;
    const mats = this.materials;

    if (type === 'carrot') {
      if (this.carrotStageTemplates && this.carrotStageTemplates.has(stageNum)) {
        const template = this.carrotStageTemplates.get(stageNum);
        const mesh = template.clone(true);
        // Anchor base strictly at soil surface (0, 0, 0)
        mesh.position.set(0, 0, 0);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.userData = { isBlenderModel: true };
        group.add(mesh);
      } else {
        this.renderProceduralCarrot(group, stageNum, mats);
      }
    } else if (type === 'wheat') {
      if (stage === 1) {
        // Stage 1: Grass-like green shoots
        for (let i = 0; i < 6; i++) {
          const shoot = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.14, 4), mats.leafSprout);
          shoot.position.set((i % 3 - 1) * 0.12, 0.07, (Math.floor(i / 3) - 0.5) * 0.12);
          group.add(shoot);
        }
      } else if (stage === 2) {
        // Stage 2: Tall green wheat stalks
        for (let i = 0; i < 9; i++) {
          const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.025, 0.38, 5), mats.wheatGreen);
          stalk.position.set((i % 3 - 1) * 0.14, 0.19, (Math.floor(i / 3) - 1) * 0.14);
          group.add(stalk);
        }
      } else if (stage === 3) {
        // Stage 3: Maturing golden-green wheat
        for (let i = 0; i < 9; i++) {
          const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.025, 0.55, 5), mats.wheatRipe);
          stalk.position.set((i % 3 - 1) * 0.14, 0.28, (Math.floor(i / 3) - 1) * 0.14);
          group.add(stalk);
        }
      } else if (stage === 4) {
        // Stage 4: Heavy golden grain sheaf with bearded awns
        for (let i = 0; i < 10; i++) {
          const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.03, 0.72, 6), mats.wheatRipe);
          stalk.position.set((i % 3 - 1) * 0.15, 0.36, (Math.floor(i / 3) - 1) * 0.15);
          stalk.rotation.z = (Math.random() - 0.5) * 0.15;
          group.add(stalk);

          // Plump grain head
          const head = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.03, 0.22, 6), mats.wheatRipe);
          head.position.set(stalk.position.x, 0.76, stalk.position.z);
          group.add(head);

          // Bearded awn whiskers
          const awn = new THREE.Mesh(new THREE.ConeGeometry(0.015, 0.12, 4), mats.wheatRipe);
          awn.position.set(stalk.position.x, 0.90, stalk.position.z);
          awn.rotation.z = (Math.random() - 0.5) * 0.25;
          group.add(awn);
        }
      }
    } else if (type === 'pumpkin') {
      if (stage === 1) {
        // Stage 1: Round cotyledon leaves
        for (let l = 0; l < 3; l++) {
          const leaf = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.02, 6), mats.leafSprout);
          leaf.position.set((l - 1) * 0.12, 0.04, 0);
          group.add(leaf);
        }
      } else if (stage === 2) {
        // Stage 2: Sprawling vine leaves
        for (let l = 0; l < 5; l++) {
          const leaf = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.03, 6), mats.leafGreen);
          const rot = (l / 5) * Math.PI * 2;
          leaf.position.set(Math.cos(rot) * 0.2, 0.08, Math.sin(rot) * 0.2);
          group.add(leaf);
        }
      } else if (stage === 3) {
        // Stage 3: Growing pale gourd on vine
        const gourd = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 10), mats.wheatRipe);
        gourd.scale.set(1.1, 0.85, 1.1);
        gourd.position.set(0, 0.16, 0);
        group.add(gourd);

        for (let l = 0; l < 4; l++) {
          const leaf = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.03, 6), mats.leafLush);
          const rot = (l / 4) * Math.PI * 2;
          leaf.position.set(Math.cos(rot) * 0.28, 0.1, Math.sin(rot) * 0.28);
          group.add(leaf);
        }
      } else if (stage === 4) {
        // Stage 4: Large ripe country pumpkin with fluted ribs & curved green stem
        const pumpkinCenter = new THREE.Mesh(new THREE.SphereGeometry(0.30, 14, 12), mats.pumpkinOrange);
        pumpkinCenter.scale.set(1.2, 0.9, 1.2);
        pumpkinCenter.position.set(0, 0.26, 0);
        pumpkinCenter.castShadow = true;
        group.add(pumpkinCenter);

        // 6 fluted ribbed lobes around circumference
        for (let lobe = 0; lobe < 6; lobe++) {
          const lMesh = new THREE.Mesh(new THREE.SphereGeometry(0.20, 10, 8), mats.pumpkinOrange);
          const lang = (lobe / 6) * Math.PI * 2;
          lMesh.scale.set(0.65, 1.02, 0.65);
          lMesh.position.set(Math.cos(lang) * 0.26, 0.26, Math.sin(lang) * 0.26);
          lMesh.castShadow = true;
          group.add(lMesh);
        }

        const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.055, 0.18, 6), mats.pumpkinStem);
        stem.position.set(0.02, 0.54, 0);
        stem.rotation.z = 0.25;
        group.add(stem);

        for (let l = 0; l < 5; l++) {
          const leaf = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.03, 6), mats.leafLush);
          const rot = (l / 5) * Math.PI * 2;
          leaf.position.set(Math.cos(rot) * 0.38, 0.10, Math.sin(rot) * 0.38);
          group.add(leaf);
        }
      }
    } else if (type === 'tomato') {
      if (stage === 1) {
        // Stage 1: Little tomato sapling on stake
        const stake = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.3, 5), mats.woodStake);
        stake.position.set(-0.05, 0.15, 0);
        group.add(stake);

        const shoot = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.18, 5), mats.leafSprout);
        shoot.position.set(0.02, 0.1, 0);
        group.add(shoot);
      } else if (stage === 2) {
        // Stage 2: Bushy tomato vine with stake
        const stake = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.6, 6), mats.woodStake);
        stake.position.set(0, 0.3, 0);
        group.add(stake);

        for (let b = 0; b < 4; b++) {
          const clump = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), mats.leafGreen);
          clump.position.set((b % 2 - 0.5) * 0.16, 0.2 + b * 0.08, (Math.floor(b / 2) - 0.5) * 0.16);
          group.add(clump);
        }
      } else if (stage === 3) {
        // Stage 3: Tall supported vine with unripe green tomatoes
        const stake = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.85, 6), mats.woodStake);
        stake.position.set(0, 0.42, 0);
        group.add(stake);

        for (let b = 0; b < 6; b++) {
          const clump = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), mats.leafLush);
          clump.position.set((b % 2 - 0.5) * 0.2, 0.25 + b * 0.09, (Math.floor(b / 2) - 0.5) * 0.2);
          group.add(clump);
        }

        for (let t = 0; t < 3; t++) {
          const greenTom = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), mats.tomatoUnripe);
          greenTom.position.set((t - 1) * 0.15, 0.35, 0.18);
          group.add(greenTom);
        }
      } else if (stage === 4) {
        // Stage 4: Trellis laden with clusters of ripe red tomatoes
        const stake = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.95, 6), mats.woodStake);
        stake.position.set(0, 0.48, 0);
        group.add(stake);

        for (let b = 0; b < 7; b++) {
          const clump = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 10), mats.leafLush);
          clump.position.set((b % 2 - 0.5) * 0.22, 0.26 + b * 0.09, (Math.floor(b / 2) - 0.5) * 0.22);
          group.add(clump);
        }

        // 4 Plump Ripe Red Tomatoes with green calyx caps
        const tomCoords = [
          { x: -0.16, y: 0.42, z: 0.2 },
          { x: 0.15, y: 0.48, z: 0.2 },
          { x: -0.12, y: 0.32, z: -0.18 },
          { x: 0.16, y: 0.36, z: -0.16 }
        ];

        tomCoords.forEach(tc => {
          const tom = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), mats.tomatoRed);
          tom.position.set(tc.x, tc.y, tc.z);
          tom.castShadow = true;
          group.add(tom);

          const calyx = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.04, 5), mats.leafGreen);
          calyx.position.set(tc.x, tc.y + 0.08, tc.z);
          group.add(calyx);
        });
      }
    }

    tile.cropGroup = group;
    tile.soilGroup.add(group);
  }

  renderProceduralCarrot(group, stage, mats) {
    if (stage === 1) {
      // Stage 1: Seedling sprout
      for (let b = 0; b < 3; b++) {
        const sprout = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.12, 5), mats.leafSprout);
        sprout.position.set((b - 1) * 0.06, 0.06, (Math.random() - 0.5) * 0.05);
        sprout.rotation.z = (b - 1) * 0.2;
        group.add(sprout);
      }
    } else if (stage === 2) {
      // Stage 2: Growing green foliage
      for (let b = 0; b < 5; b++) {
        const frond = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.26, 5), mats.leafGreen);
        const rot = (b / 5) * Math.PI * 2;
        frond.position.set(Math.cos(rot) * 0.08, 0.13, Math.sin(rot) * 0.08);
        frond.rotation.z = 0.25;
        group.add(frond);
      }
    } else if (stage === 3) {
      // Stage 3: Mature leafy top, emerging orange crown
      const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.04, 0.08, 8), mats.carrotOrange);
      crown.position.set(0, 0.04, 0);
      group.add(crown);

      for (let b = 0; b < 6; b++) {
        const frond = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.38, 5), mats.leafLush);
        const rot = (b / 6) * Math.PI * 2;
        frond.position.set(Math.cos(rot) * 0.1, 0.22, Math.sin(rot) * 0.1);
        frond.rotation.z = 0.28;
        group.add(frond);
      }
    } else if (stage === 4) {
      // Stage 4: Ready to harvest! Exposed ripe carrot root with lush feathery top
      const root = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.36, 8), mats.carrotOrange);
      root.rotation.x = Math.PI;
      root.position.set(0, 0.12, 0);
      root.castShadow = true;
      group.add(root);

      for (let b = 0; b < 7; b++) {
        const frond = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.48, 5), mats.leafLush);
        const rot = (b / 7) * Math.PI * 2;
        frond.position.set(Math.cos(rot) * 0.12, 0.38, Math.sin(rot) * 0.12);
        frond.rotation.z = 0.32;
        group.add(frond);
      }
    }
  }

  advanceTutorial(targetStep) {
    if (this.tutorial.completed || this.tutorial.skipped) return;
    this.tutorial.step = Math.max(this.tutorial.step, targetStep);
    const evt = new CustomEvent('tutorial:update', { detail: this.tutorial });
    window.dispatchEvent(evt);
  }

  completeTutorial() {
    this.tutorial.completed = true;
    this.tutorial.step = 7;
    const evt = new CustomEvent('tutorial:update', { detail: this.tutorial });
    window.dispatchEvent(evt);
  }

  skipTutorial() {
    this.tutorial.skipped = true;
    const evt = new CustomEvent('tutorial:update', { detail: this.tutorial });
    window.dispatchEvent(evt);
  }

  serialize() {
    const tileList = [];
    this.tiles.forEach(tile => {
      tileList.push({
        gx: tile.gx,
        gz: tile.gz,
        isWatered: !!tile.isWatered,
        crop: tile.crop ? {
          type: tile.crop.type,
          stage: tile.crop.stage,
          visualStage: tile.crop.visualStage || tile.crop.stage || 1,
          daysWatered: tile.crop.daysWatered,
          plantedDay: tile.crop.plantedDay
        } : null
      });
    });

    return {
      tiles: tileList,
      tools: {
        activeToolIndex: this.activeToolIndex,
        selectedCropId: this.selectedCropId,
        wateringCan: {
          current: this.wateringCanCurrent,
          max: this.wateringCanMax
        }
      },
      tutorial: {
        step: this.tutorial.step,
        completed: this.tutorial.completed,
        skipped: this.tutorial.skipped
      }
    };
  }

  restoreState(savedFarming) {
    if (!savedFarming) return;

    // 1. Restore Tools State
    if (savedFarming.tools) {
      if (typeof savedFarming.tools.activeToolIndex === 'number') {
        this.activeToolIndex = savedFarming.tools.activeToolIndex;
      }
      if (savedFarming.tools.selectedCropId) {
        this.selectedCropId = savedFarming.tools.selectedCropId;
      }
      if (savedFarming.tools.wateringCan) {
        this.wateringCanCurrent = savedFarming.tools.wateringCan.current ?? 12;
        this.wateringCanMax = savedFarming.tools.wateringCan.max ?? 12;
      }
    }

    // 2. Restore Tutorial State
    if (savedFarming.tutorial) {
      this.tutorial.step = savedFarming.tutorial.step ?? 1;
      this.tutorial.completed = !!savedFarming.tutorial.completed;
      this.tutorial.skipped = !!savedFarming.tutorial.skipped;
    }

    // 3. Clear existing dynamic tiles
    this.tiles.forEach(tile => {
      this.farmingGroup.remove(tile.soilGroup);
    });
    this.tiles.clear();

    // 4. Reconstruct tiles
    if (Array.isArray(savedFarming.tiles)) {
      savedFarming.tiles.forEach(savedTile => {
        const { gx, gz, isWatered, crop } = savedTile;
        const key = `${gx}_${gz}`;

        // Create clean 1x1m soil bed mesh aligned to grid
        const { soilGroup, soilMesh, furrows } = this.createSoilBedMesh(!!isWatered);
        soilGroup.position.set(gx, 0.0, gz);

        this.farmingGroup.add(soilGroup);

        const tileData = {
          gx,
          gz,
          key,
          isTilled: true,
          isWatered: !!isWatered,
          crop: crop ? {
            type: crop.type,
            stage: crop.stage || 1,
            visualStage: crop.visualStage || crop.stage || 1,
            daysWatered: crop.daysWatered || 0,
            plantedDay: crop.plantedDay || 1
          } : null,
          soilGroup,
          soilMesh,
          furrows,
          cropGroup: null
        };

        this.tiles.set(key, tileData);

        if (tileData.crop) {
          this.renderCropMesh(tileData);
        }
      });
    }

    events.emit('farming:restored', { tileCount: this.tiles.size });
  }
}
