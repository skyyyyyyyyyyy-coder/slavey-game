import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const chromePath = 'C:\\Users\\chlov\\AppData\\Local\\ms-playwright\\chromium-1234\\chrome-win64\\chrome.exe';
const port = 9330;

const chrome = spawn(chromePath, [
  '--headless=new',
  '--no-sandbox',
  '--window-size=1920,1080',
  '--remote-debugging-port=' + port,
  'http://localhost:5174/?started=1'
], { stdio: 'ignore' });

async function run() {
  console.log('=== MEADOW VALLEY STAGE 1 VERIFICATION & PROOF CAPTURES ===');
  await new Promise(r => setTimeout(r, 2500));

  const tabsRes = await fetch(`http://127.0.0.1:${port}/json`);
  const tabs = await tabsRes.json();
  const pageTab = tabs.find(t => t.type === 'page' || t.url.includes('localhost'));
  if (!pageTab) throw new Error('No page tab found');

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

  // Helper to capture full screenshot
  async function capture(filename) {
    const res = await send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(res.data, 'base64');
    const outPath = path.join('screenshots', filename);
    fs.writeFileSync(outPath, buffer);
    console.log(`📸 Saved screenshot: ${outPath} (${(buffer.length / 1024).toFixed(1)} KB)`);
  }

  // 1. Wait for scene and assets
  await send('Runtime.evaluate', {
    awaitPromise: true,
    expression: `(async () => {
      let tries = 0;
      while ((!window.world || !window.farmingManager?.assetsLoaded) && tries < 30) {
        await new Promise(r => setTimeout(r, 100));
        tries++;
      }
    })()`
  });

  // 2. Comprehensive Spatial Invariant Audit in live engine
  const auditRes = await send('Runtime.evaluate', {
    awaitPromise: true,
    returnByValue: true,
    expression: `(() => {
      const w = window.world;
      const fm = window.farmingManager;

      // 6 Arable zones from FarmingManager
      const arable = [
        { name: 'Zone 1: West Homestead Arable Field', xMin: -10, xMax: -4,  zMin: -2,  zMax: 10 },
        { name: 'Zone 2: South-West Farm Field Paddock', xMin: -22, xMax: -10, zMin: 11,  zMax: 21 },
        { name: 'Zone 3: North-West Farm Field Paddock', xMin: -22, xMax: -10, zMin: -19, zMax: -9 },
        { name: 'Zone 4: South-East Farm Field Paddock', xMin: 10,  xMax: 22,  zMin: 11,  zMax: 21 },
        { name: 'Zone 5: North-East Farm Field Paddock', xMin: 10,  xMax: 22,  zMin: -19, zMax: -9 },
        { name: 'Zone 6: East Homestead Arable Field', xMin: 4,   xMax: 10,  zMin: -2,  zMax: 10 }
      ];

      // Fenced paddocks
      const paddocks = [
        { name: 'Carrot Paddock NW', x: -16, z: -14, hw: 7.0, hd: 5.0 },
        { name: 'Pumpkin Paddock NE', x: 16,  z: -14, hw: 7.0, hd: 5.0 },
        { name: 'Wheat Paddock SW', x: -16, z: 16,  hw: 7.0, hd: 5.0 },
        { name: 'Garden Paddock SE', x: 16,  z: 16,  hw: 7.0, hd: 5.0 }
      ];

      const treeColliders = w.world.cylinders;
      const violations = [];

      for (const cyl of treeColliders) {
        // Check arable
        for (const z of arable) {
          if (cyl.x >= z.xMin - 0.5 && cyl.x <= z.xMax + 0.5 && cyl.z >= z.zMin - 0.5 && cyl.z <= z.zMax + 0.5) {
            violations.push({ type: 'Inside Arable Zone', cyl, zone: z.name });
          }
        }
        // Check paddocks
        for (const p of paddocks) {
          if (Math.abs(cyl.x - p.x) <= p.hw + 0.5 && Math.abs(cyl.z - p.z) <= p.hd + 0.5) {
            violations.push({ type: 'Inside Paddock', cyl, paddock: p.name });
          }
        }
        // Check barrier walls (N: -42.5, S: 46.0, W: -48.0, E: 48.0)
        if (cyl.z <= -42.5 || cyl.z >= 46.0 || cyl.x <= -48.0 || cyl.x >= 48.0) {
          violations.push({ type: 'Penetrating Barrier Wall', cyl });
        }
      }

      return {
        totalCylinders: treeColliders.length,
        violationsCount: violations.length,
        violations
      };
    })()`
  });
  console.log('Spatial Invariant Audit:', auditRes.result?.value);

  // PROOF 1: No trees inside farming plots (Camera overlooking NE Pumpkin Patch & Orchard)
  await send('Runtime.evaluate', {
    expression: `(() => {
      window.player.respawn(new THREE.Vector3(16.0, 5.5, -4.0));
      window.player.yaw = Math.PI; // Look north directly across Pumpkin paddock and toward orchard
      window.player.pitch = -0.32;
    })()`
  });
  await new Promise(r => setTimeout(r, 600));
  await capture('stage1_01_farming_plots_clear_of_trees.png');

  // PROOF 2: No trees intersecting mountain boundaries (North Forest Belt & South Woodlands)
  await send('Runtime.evaluate', {
    expression: `(() => {
      window.player.respawn(new THREE.Vector3(0.0, 4.0, -14.0));
      window.player.yaw = Math.PI; // Look north at farmhouse and mountain perimeter forest
      window.player.pitch = 0.05;
    })()`
  });
  await new Promise(r => setTimeout(r, 600));
  await capture('stage1_02_mountain_boundaries_clear.png');

  // PROOF 3: No trees blocking paths or fences (Looking down East Cross-Lane)
  await send('Runtime.evaluate', {
    expression: `(() => {
      window.player.respawn(new THREE.Vector3(4.0, 1.4, -8.0));
      window.player.yaw = -Math.PI / 2; // Look east straight along East Cross-Lane
      window.player.pitch = 0.0;
    })()`
  });
  await new Promise(r => setTimeout(r, 600));
  await capture('stage1_03_paths_fences_clear.png');

  // PROOF 4: Blender Soil appears after tilling and watering
  const soilTest = await send('Runtime.evaluate', {
    awaitPromise: true,
    returnByValue: true,
    expression: `(() => {
      const fm = window.farmingManager;
      const p = window.player;

      // Till a new tile at gx: -5, gz: 1 (inside Zone 1, next to demo field)
      p.stamina = 100;
      fm.activeToolIndex = 0; // Hoe
      const tillOk = fm.tillTile(-5, 1, p);

      // Water the newly tilled tile
      fm.activeToolIndex = 1; // Watering can
      fm.wateringCanCurrent = 12;
      const t = fm.tiles.get('-5_1');
      const waterOk = fm.waterTile(t, p);

      // Check tile mesh
      const isBlender = !!t.soilMesh?.userData?.isBlenderModel;
      const matColor = t.soilMesh?.material?.color?.getHexString();
      const hasMap = !!t.soilMesh?.material?.map;

      // Position player to look down at this newly tilled and watered tile
      p.respawn(new THREE.Vector3(-5.0, 1.45, -0.2));
      p.yaw = Math.PI;
      p.pitch = -0.65;

      return { tillOk, waterOk, isBlender, matColor, hasMap };
    })()`
  });
  console.log('Tilling and Watering Result:', soilTest.result?.value);
  await new Promise(r => setTimeout(r, 600));
  await capture('stage1_04_blender_soil_tilled_watered.png');

  // PROOF 5: Apple harvesting still works
  const harvestTest = await send('Runtime.evaluate', {
    awaitPromise: true,
    returnByValue: true,
    expression: `(() => {
      const p = window.player;
      const w = window.world;

      // Position player right at apple tree 3 (x: 25.8, z: -4.2)
      p.respawn(new THREE.Vector3(25.4, 1.48, -3.4));
      p.yaw = -0.74;
      p.pitch = 0.50;

      // Find fruit 0 on tree 3
      const fruit = w.interactables.find(i => i.id === 'apple_tree_3_fruit_0');
      const beforeCount = p.getItemCount('apple');
      fruit.interact(p);
      const afterCount = p.getItemCount('apple');

      return {
        fruitId: fruit.id,
        beforeCount,
        afterCount,
        readyAfterInteract: fruit.ready,
        backpackGained: afterCount > beforeCount
      };
    })()`
  });
  console.log('Apple Harvest Result:', harvestTest.result?.value);
  await new Promise(r => setTimeout(r, 600));
  await capture('stage1_05_apple_harvesting_verified.png');

  ws.close();
  chrome.kill();
  console.log('=== STAGE 1 VERIFICATION & PROOF COMPLETE ===');
}

run().catch(err => {
  console.error('ERROR in Stage 1 proof capture:', err);
  chrome.kill();
  process.exit(1);
});
