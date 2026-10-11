import { spawn } from 'child_process';

const chromePath = 'C:\\Users\\chlov\\AppData\\Local\\ms-playwright\\chromium-1234\\chrome-win64\\chrome.exe';
const chrome = spawn(chromePath, [
  '--headless=new',
  '--no-sandbox',
  '--window-size=1920,1080',
  '--remote-debugging-port=9322',
  'http://localhost:5174/?started=1&cam=c1-overview'
], { stdio: 'ignore' });

async function run() {
  console.log('=== MEADOW VALLEY SIMULATOR — STAGE C1 VERIFICATION SUITE ===');
  await new Promise(r => setTimeout(r, 2200));

  const tabsRes = await fetch('http://127.0.0.1:9322/json');
  const tabs = await tabsRes.json();
  const pageTab = tabs.find(t => t.type === 'page' || t.url.includes('localhost'));
  if (!pageTab) throw new Error('Could not find active game page tab');

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

  // 1. Wait for Blender farming assets to load
  console.log('1. Checking Blender Assets Loading...');
  const assetCheck = await send('Runtime.evaluate', {
    awaitPromise: true,
    expression: `(async () => {
      let attempts = 0;
      while (!window.farmingManager?.assetsLoaded && attempts < 20) {
        await new Promise(r => setTimeout(r, 100));
        attempts++;
      }
      return {
        assetsLoaded: window.farmingManager?.assetsLoaded,
        hasSoilTemplate: !!window.farmingManager?.soilTemplate,
        carrotStages: Array.from(window.farmingManager?.carrotStageTemplates?.keys() || []),
        tileCount: window.farmingManager?.tiles?.size || 0
      };
    })()`,
    returnByValue: true
  });
  console.log('Asset Check Result:', assetCheck.result?.value);

  // 2. Soil Tile Mesh & Material Inspection
  console.log('2. Inspecting Soil Tile Mesh & Material...');
  const soilCheck = await send('Runtime.evaluate', {
    awaitPromise: true,
    expression: `(() => {
      const fm = window.farmingManager;
      const sampleTile = fm.tiles.get('-7_2') || Array.from(fm.tiles.values())[0];
      const soilMesh = sampleTile?.soilMesh;
      const dryMat = fm.materials.drySoil;
      const wateredMat = fm.materials.wateredSoil;

      const box = new THREE.Box3().setFromObject(soilMesh);
      const size = new THREE.Vector3();
      box.getSize(size);

      return {
        isBlenderModel: !!soilMesh.userData?.isBlenderModel,
        dimensions: {
          width: +size.x.toFixed(3),
          height: +size.y.toFixed(3),
          depth: +size.z.toFixed(3)
        },
        dryMaterial: {
          roughness: +dryMat.roughness.toFixed(2),
          metalness: +dryMat.metalness.toFixed(2),
          vertexColors: !!dryMat.vertexColors
        },
        wateredMaterial: {
          roughness: +wateredMat.roughness.toFixed(2),
          metalness: +wateredMat.metalness.toFixed(2),
          vertexColors: !!wateredMat.vertexColors
        }
      };
    })()`,
    returnByValue: true
  });
  console.log('Soil Check Result:', soilCheck.result?.value);

  // 3. Carrot 4 Stages Inspection (Heights & Anchoring)
  console.log('3. Inspecting Carrot 4 Stages Geometric Hierarchy...');
  const carrotCheck = await send('Runtime.evaluate', {
    awaitPromise: true,
    expression: `(() => {
      const fm = window.farmingManager;
      const res = {};
      [1, 2, 3, 4].forEach(stage => {
        const mesh = fm.carrotStageTemplates.get(stage);
        if (mesh) {
          const box = new THREE.Box3().setFromObject(mesh);
          const size = new THREE.Vector3();
          box.getSize(size);
          res[stage] = {
            name: mesh.name,
            minY: +box.min.y.toFixed(3),
            maxY: +box.max.y.toFixed(3),
            height: +size.y.toFixed(3),
            isRootAnchored: Math.abs(box.min.y) < 0.05
          };
        }
      });
      return res;
    })()`,
    returnByValue: true
  });
  console.log('Carrot Check Result:', carrotCheck.result?.value);

  // 4. Two-Tier Monotonic Growth State Machine Test
  console.log('4. Verifying Two-Tier Monotonic Growth State Machine...');
  const growthCheck = await send('Runtime.evaluate', {
    awaitPromise: true,
    expression: `(async () => {
      const fm = window.farmingManager;
      const tm = window.timeManager;
      const p = window.player;

      // Ensure test tile in kitchen garden
      const testKey = '-6_2';
      let tile = fm.tiles.get(testKey);
      if (!tile) {
        fm.tillTile(-6, 2, p);
        tile = fm.tiles.get(testKey);
      }

      // Step A: Plant carrot seed (Day 1 morning)
      p.addToBackpack('seed_carrot', 5);
      if (tile.crop) {
        if (tile.cropGroup) tile.soilGroup.remove(tile.cropGroup);
        tile.crop = null;
      }
      tm.setTime(8, 0);
      fm.plantCrop(tile, 'carrot', p);
      const afterPlant = { stage: tile.crop.stage, visualStage: tile.crop.visualStage, daysWatered: tile.crop.daysWatered };

      // Step B: Water tile on Day 1
      fm.wateringCanCurrent = 12;
      fm.waterTile(tile, p);
      const afterWaterDay1 = { isWatered: tile.isWatered, daysWatered: tile.crop.daysWatered };

      // Step C: Day 1 Rollover to Day 2 morning -> Days watered becomes 1, Stage 2 Growing
      tm.advanceDay();
      tm.setTime(6, 0);
      fm.handleDayRollover();
      const afterDay2Morning = {
        stage: tile.crop.stage,
        visualStage: tile.crop.visualStage,
        daysWatered: tile.crop.daysWatered,
        isHarvestable: tile.crop.stage === 4
      };

      // Step D: Advance to Day 2 Midday 12:00 PM -> Should advance visualStage to 3, but stage remains 2 (NOT harvestable)
      tm.setTime(12, 0);
      fm.checkIntradayGrowth();
      const afterDay2Midday = {
        stage: tile.crop.stage,
        visualStage: tile.crop.visualStage,
        daysWatered: tile.crop.daysWatered,
        isHarvestable: tile.crop.stage === 4
      };

      // Step E: Day 2 Rollover to Day 3 morning WITHOUT watering on Day 2 -> Monotonic check!
      // Must NOT revert visualStage from 3 to 2!
      tm.advanceDay();
      tm.setTime(6, 0); // 06:00 AM Dawn
      fm.handleDayRollover();
      const afterRolloverUnwatered = {
        stage: tile.crop.stage,
        visualStage: tile.crop.visualStage,
        daysWatered: tile.crop.daysWatered,
        visualNeverRegressed: tile.crop.visualStage === 3,
        isHarvestable: tile.crop.stage === 4
      };

      // Step F: Now water tile on Day 3 and advance to Day 4 -> Days watered becomes 2, Stage 4 Harvest Ready!
      fm.wateringCanCurrent = 12;
      fm.waterTile(tile, p);
      tm.advanceDay();
      tm.setTime(6, 0);
      fm.handleDayRollover();
      const afterDay3Watered = {
        stage: tile.crop.stage,
        visualStage: tile.crop.visualStage,
        daysWatered: tile.crop.daysWatered,
        isHarvestable: tile.crop.stage === 4
      };

      // Step G: Harvest interaction
      const initialCarrotCount = p.getItemCount('carrot');
      const harvestSuccess = fm.harvestCrop(tile, p);
      const finalCarrotCount = p.getItemCount('carrot');
      const cropRemoved = tile.crop === null;

      return {
        afterPlant,
        afterWaterDay1,
        afterDay2Morning,
        afterDay2Midday,
        afterRolloverUnwatered,
        afterDay3Watered,
        harvest: {
          harvestSuccess,
          harvestedYield: finalCarrotCount - initialCarrotCount,
          cropRemoved
        }
      };
    })()`,
    returnByValue: true
  });
  console.log('Growth Check Result:', JSON.stringify(growthCheck.result?.value, null, 2));

  // 5. Save / Restore Roundtrip Verification
  console.log('5. Verifying Save & Restore Roundtrip Persistence...');
  const saveCheck = await send('Runtime.evaluate', {
    awaitPromise: true,
    expression: `(async () => {
      const fm = window.farmingManager;
      const sm = window.saveManager;

      // Reset to 3x3 demonstration field
      fm.createDemoField();
      const preSerialized = fm.serialize();

      // Save to storage
      sm.save('stage_c1_verification_test');

      // Wipe current tiles
      fm.tiles.forEach(t => fm.farmingGroup.remove(t.soilGroup));
      fm.tiles.clear();
      const clearedCount = fm.tiles.size;

      // Restore from saved data
      const loaded = sm.load();
      fm.restoreState(loaded.farming);
      const restoredCount = fm.tiles.size;

      // Verify restored tile attributes
      const restoredStage3 = fm.tiles.get('-6_1')?.crop?.visualStage;
      const restoredStage4 = fm.tiles.get('-8_2')?.crop?.stage;
      const restoredWatered = fm.tiles.get('-8_3')?.isWatered;

      return {
        preTileCount: preSerialized.tiles.length,
        clearedCount,
        restoredCount,
        restoredStage3,
        restoredStage4,
        restoredWatered
      };
    })()`,
    returnByValue: true
  });
  console.log('Save Check Result:', saveCheck.result?.value);

  // 6. Draw Calls and Frame Rate Telemetry
  console.log('6. Profiling Draw Calls and Frame Performance...');
  const perfCheck = await send('Runtime.evaluate', {
    awaitPromise: true,
    expression: `(async () => {
      const renderer = window.renderer;
      const frameDeltas = [];
      let lastTime = performance.now();

      await new Promise(resolve => {
        let frames = 0;
        function onFrame() {
          const now = performance.now();
          frameDeltas.push(now - lastTime);
          lastTime = now;
          frames++;
          if (frames < 60) {
            requestAnimationFrame(onFrame);
          } else {
            resolve();
          }
        }
        requestAnimationFrame(onFrame);
      });

      const avgDelta = frameDeltas.reduce((a, b) => a + b, 0) / frameDeltas.length;
      const fps = 1000 / avgDelta;
      const calls = renderer.info.render.calls;
      const triangles = renderer.info.render.triangles;
      const geometries = renderer.info.memory.geometries;
      const textures = renderer.info.memory.textures;

      return {
        fps: +fps.toFixed(1),
        avgDeltaMs: +avgDelta.toFixed(2),
        drawCallsTotal: calls,
        triangles,
        geometries,
        textures
      };
    })()`,
    returnByValue: true
  });
  console.log('Performance Telemetry:', perfCheck.result?.value);

  chrome.kill();
  console.log('=== VERIFICATION COMPLETED ===');
}

run().catch(e => {
  console.error('VERIFICATION ERROR:', e);
  chrome.kill();
});
