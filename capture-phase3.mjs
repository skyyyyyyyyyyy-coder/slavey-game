import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const chromePath = 'C:\\Users\\chlov\\AppData\\Local\\ms-playwright\\chromium-1234\\chrome-win64\\chrome.exe';
const artifactDir = 'C:\\Users\\chlov\\.gemini\\antigravity\\brain\\ae1064fc-6b1a-4ed2-8e9f-297a7e6a7197';

if (!fs.existsSync('screenshots')) {
  fs.mkdirSync('screenshots', { recursive: true });
}

let portCounter = 9230;

async function capture(url, outFile, width, height, setupFn) {
  const port = portCounter++;
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--no-sandbox',
    `--window-size=${width},${height}`,
    `--remote-debugging-port=${port}`,
    url
  ], { stdio: 'ignore' });

  await new Promise(r => setTimeout(r, 2200));

  try {
    const res = await fetch(`http://127.0.0.1:${port}/json`);
    const tabs = await res.json();
    const pageTab = tabs.find(t => t.type === 'page' || t.url.includes('localhost'));
    const ws = new WebSocket(pageTab.webSocketDebuggerUrl);
    await new Promise(r => ws.onopen = r);

    let id = 1;
    function send(method, params = {}) {
      return new Promise(resolve => {
        const curId = id++;
        const handler = (evt) => {
          const d = JSON.parse(evt.data);
          if (d.id === curId) {
            ws.removeEventListener('message', handler);
            resolve(d.result);
          }
        };
        ws.addEventListener('message', handler);
        ws.send(JSON.stringify({ id: curId, method, params }));
      });
    }

    await send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: false
    });

    if (setupFn) {
      await send('Runtime.evaluate', { expression: setupFn, awaitPromise: true });
      await new Promise(r => setTimeout(r, 800));
    }

    const shot = await send('Page.captureScreenshot');
    const localPath = path.join('screenshots', outFile);
    const artifactPath = path.join(artifactDir, outFile);

    fs.writeFileSync(localPath, Buffer.from(shot.data, 'base64'));
    fs.writeFileSync(artifactPath, Buffer.from(shot.data, 'base64'));
    console.log(`Captured ${width}x${height} -> ${outFile}`);
    chrome.kill();
  } catch (err) {
    console.error(`Failed to capture ${outFile}:`, err);
    chrome.kill();
  }
}

async function run() {
  console.log('Starting Phase 3 high-resolution screenshot captures...');

  // Setup script that generates a diverse farm grid with 4 crops across stages 1 to 4
  const setupFarmPlots = `
    (async () => {
      const p = window.player;
      const fm = window.farmingManager;
      const tm = window.timeManager;

      // Position player at South edge looking North (yaw = 0) at the farm plot
      p.position.set(-5.5, 1.4, 0.2);
      p.yaw = 0.0;
      p.pitch = -0.35;
      p.camera.rotation.set(0, 0, 0);
      p.camera.rotation.order = 'YXZ';
      p.camera.rotation.y = p.yaw;
      p.camera.rotation.x = p.pitch;

      // Clean old tiles
      fm.tiles.forEach(t => fm.farmingGroup.remove(t.soilGroup));
      fm.tiles.clear();

      // Create a 4x4 showcase farm
      // Row 1: Carrots (z = -1.8)
      // Row 2: Wheat (z = -3.2)
      // Row 3: Pumpkin (z = -4.6)
      // Row 4: Tomato (z = -6.0)
      const crops = ['carrot', 'wheat', 'pumpkin', 'tomato'];
      crops.forEach((cropId, rIdx) => {
        const gz = -1.8 - rIdx * 1.4;
        for (let s = 1; s <= 4; s++) {
          const gx = -7.5 + (s - 1) * 1.4;
          fm.tillTile(gx, gz, p);
          const tile = fm.tiles.get(gx + '_' + gz);
          if (tile) {
            tile.crop = {
              type: cropId,
              stage: s,
              daysWatered: s,
              plantedDay: 1
            };
            // Alternate watering for moisture visual contrast
            if (s % 2 === 0) {
              tile.isWatered = true;
              tile.soilMesh.material = fm.materials.wateredSoil;
            }
            fm.renderCropMesh(tile);
          }
        }
      });

      // Equip Hoe [1]
      fm.activeToolIndex = 0;
      fm.wateringCanCurrent = 12;
      fm.tutorial.step = 2;
      window.dispatchEvent(new CustomEvent('tutorial:update', { detail: fm.tutorial }));

      // Force update
      p.update(0.016, window.world.interactables);
      fm.updateTargeting(p);
    })()
  `;

  // 1. FARMING GRID & CROP GROWTH STAGES (1920x1080 and 1440x900)
  await capture('http://localhost:5174/?started=1&time=08:00', 'phase3_02_crop_growth_stages_1920x1080.png', 1920, 1080, setupFarmPlots);
  await capture('http://localhost:5174/?started=1&time=08:00', 'phase3_02_crop_growth_stages_1440x900.png', 1440, 900, setupFarmPlots);

  // 2. CLOSE-UP READY TO HARVEST PUMPKIN & CARROT WITH PROMPT (1920x1080 and 1440x900)
  const setupHarvestView = `
    (async () => {
      const p = window.player;
      const fm = window.farmingManager;

      // Clean old tiles
      fm.tiles.forEach(t => fm.farmingGroup.remove(t.soilGroup));
      fm.tiles.clear();

      // Place a ripe pumpkin at (-5, -3) and a ripe tomato at (-3.5, -3)
      fm.tillTile(-5, -3, p);
      const pumpkinTile = fm.tiles.get('-5_-3');
      pumpkinTile.crop = { type: 'pumpkin', stage: 4, daysWatered: 4, plantedDay: 1 };
      fm.renderCropMesh(pumpkinTile);

      fm.tillTile(-3.5, -3, p);
      const tomatoTile = fm.tiles.get('-3.5_-3');
      tomatoTile.crop = { type: 'tomato', stage: 4, daysWatered: 4, plantedDay: 1 };
      fm.renderCropMesh(tomatoTile);

      fm.tillTile(-6.5, -3, p);
      const carrotTile = fm.tiles.get('-6.5_-3');
      carrotTile.crop = { type: 'carrot', stage: 4, daysWatered: 2, plantedDay: 1 };
      fm.renderCropMesh(carrotTile);

      // Stand grounded in front of ripe pumpkin looking directly at it
      p.position.set(-5, 0, -1.5);
      p.velocity.set(0, 0, 0);
      p.onGround = true;
      p.yaw = 0.0;
      p.pitch = -Math.atan2(1.65, 1.5); // exactly hits -3.0
      p.camera.rotation.set(0, 0, 0);
      p.camera.rotation.order = 'YXZ';
      p.camera.rotation.y = p.yaw;
      p.camera.rotation.x = p.pitch;

      // Equip Hoe [1]
      fm.activeToolIndex = 0;
      fm.wateringCanCurrent = 11;
      fm.tutorial.step = 7;
      window.dispatchEvent(new CustomEvent('tutorial:update', { detail: fm.tutorial }));
      window.dispatchEvent(new CustomEvent('tool:change', { detail: { toolIndex: 0 } }));

      p.update(0.016, window.world.interactables);
      fm.updateTargeting(p);

      // Emit subtle golden harvest sparkles near pumpkin
      if (window.particleManager) {
        window.particleManager.emitHarvestPop(new THREE.Vector3(-5, 0.4, -3));
      }
    })()
  `;
  await capture('http://localhost:5174/?started=1&time=17:00', 'phase3_03_harvest_ready_1920x1080.png', 1920, 1080, setupHarvestView);
  await capture('http://localhost:5174/?started=1&time=17:00', 'phase3_03_harvest_ready_1440x900.png', 1440, 900, setupHarvestView);

  // 3. TILLED SOIL GRID & WATERING CAN WITH MOISTURE CONTRAST (1920x1080 and 1440x900)
  const setupTilledGrid = `
    (async () => {
      const p = window.player;
      const fm = window.farmingManager;

      // Clean old tiles
      fm.tiles.forEach(t => fm.farmingGroup.remove(t.soilGroup));
      fm.tiles.clear();

      // Create a 3x3 plot of dry vs watered soil
      for (let x = -6; x <= -4; x++) {
        for (let z = -4; z <= -2; z++) {
          fm.tillTile(x, z, p);
          const t = fm.tiles.get(x + '_' + z);
          if ((x + z) % 2 === 0) {
            t.isWatered = true;
            t.soilMesh.material = fm.materials.wateredSoil;
          }
        }
      }

      // Stand grounded in front of dry tile at (-5, -2) aiming at dry soil with Watering Can
      p.position.set(-5, 0, -0.6);
      p.velocity.set(0, 0, 0);
      p.onGround = true;
      p.yaw = 0.0;
      p.pitch = -Math.atan2(1.65, 1.4); // exactly hits -2.0
      p.camera.rotation.set(0, 0, 0);
      p.camera.rotation.order = 'YXZ';
      p.camera.rotation.y = p.yaw;
      p.camera.rotation.x = p.pitch;

      // Equip Watering Can [2]
      fm.activeToolIndex = 1;
      fm.wateringCanCurrent = 8;
      fm.tutorial.step = 6;
      window.dispatchEvent(new CustomEvent('tutorial:update', { detail: fm.tutorial }));
      window.dispatchEvent(new CustomEvent('tool:change', { detail: { toolIndex: 1 } }));

      p.update(0.016, window.world.interactables);
      fm.updateTargeting(p);
    })()
  `;
  await capture('http://localhost:5174/?started=1&time=12:00', 'phase3_01_farming_grid_1920x1080.png', 1920, 1080, setupTilledGrid);
  await capture('http://localhost:5174/?started=1&time=12:00', 'phase3_01_farming_grid_1440x900.png', 1440, 900, setupTilledGrid);

  // 4. FULL BACKPACK INVENTORY MODAL & HUD TOOL SHOWCASE (1920x1080 and 1440x900)
  const setupInventoryModal = `
    (async () => {
      const p = window.player;
      const modal = document.getElementById('backpack-modal');
      
      // Give player some sample harvested crops
      p.backpack.find(b => b.id === 'apple').count = 12;
      p.backpack.find(b => b.id === 'carrot').count = 18;
      p.backpack.find(b => b.id === 'wheat').count = 14;
      p.backpack.find(b => b.id === 'pumpkin').count = 5;
      p.backpack.find(b => b.id === 'tomato').count = 9;

      window.dispatchEvent(new CustomEvent('backpack:update', { detail: { backpack: p.backpack } }));

      // Open Modal
      if (modal) modal.classList.remove('hidden');
    })()
  `;
  await capture('http://localhost:5174/?started=1&time=08:00', 'phase3_04_inventory_and_hud_1920x1080.png', 1920, 1080, setupInventoryModal);
  await capture('http://localhost:5174/?started=1&time=08:00', 'phase3_04_inventory_and_hud_1440x900.png', 1440, 900, setupInventoryModal);

  console.log('All Phase 3 captures completed successfully!');
}

run();
