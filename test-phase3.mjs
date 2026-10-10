import { spawn } from 'child_process';

const chromePath = 'C:\\Users\\chlov\\AppData\\Local\\ms-playwright\\chromium-1234\\chrome-win64\\chrome.exe';
const port = 9226;

console.log('Launching headless Chrome for Phase 3 Farming QA on port ' + port);
const chrome = spawn(chromePath, [
  '--headless=new',
  '--no-sandbox',
  `--remote-debugging-port=${port}`,
  'http://localhost:5174/?started=1'
], { stdio: 'ignore' });

await new Promise(r => setTimeout(r, 2000));

try {
  const res = await fetch(`http://127.0.0.1:${port}/json`);
  const tabs = await res.json();
  const pageTab = tabs.find(t => t.type === 'page' || t.url.includes('localhost'));

  if (!pageTab) {
    console.error('Could not find active page tab:', tabs);
    process.exit(1);
  }

  const ws = new WebSocket(pageTab.webSocketDebuggerUrl);
  let idCounter = 1;
  const pending = new Map();
  const consoleMessages = [];

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.method === 'Runtime.consoleAPICalled') {
      consoleMessages.push(msg.params.args.map(a => a.value).join(' '));
    }
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)(msg.result);
      pending.delete(msg.id);
    }
  };

  await new Promise(r => ws.onopen = r);

  function send(method, params = {}) {
    const id = idCounter++;
    return new Promise(resolve => {
      pending.set(id, resolve);
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  await send('Runtime.enable');
  await send('Page.enable');

  // Let game settle
  await new Promise(r => setTimeout(r, 1200));

  const evaluation = await send('Runtime.evaluate', {
    expression: `
      (async function() {
        const results = {
          checks: [],
          fps: 0,
          passCount: 0,
          failCount: 0
        };

        function assert(name, condition, details = '') {
          if (condition) {
            results.checks.push({ name, status: 'PASS', details });
            results.passCount++;
          } else {
            results.checks.push({ name, status: 'FAIL', details });
            results.failCount++;
          }
        }

        const p = window.player;
        const w = window.world;
        const tm = window.timeManager;
        const fm = window.farmingManager;
        const sm = window.saveManager;

        // 1. Initial State Assertions
        assert('FarmingManager Exists & Initialized', !!fm);
        assert('4 Crops Defined (Carrot, Wheat, Pumpkin, Tomato)', !!window.CROPS && Object.keys(window.CROPS).length === 4);
        assert('4 Farming Tools Defined', !!window.TOOLS && window.TOOLS.length === 4);
        assert('Watering Can Starts Full (12/12)', fm.wateringCanCurrent === 12 && fm.wateringCanMax === 12);
        assert('Backpack Contains Starter Seeds', p.getItemCount('seed_carrot') >= 6 && p.getItemCount('seed_wheat') >= 6 && p.getItemCount('seed_pumpkin') >= 4 && p.getItemCount('seed_tomato') >= 4);

        // 2. Grid Boundary Validation (canTill)
        const checkRoad = fm.canTill(0, 5); // on main stone road
        assert('Tilling Blocked on Main Stone Lane', !checkRoad.valid, checkRoad.reason);

        const checkCross = fm.canTill(10, -8); // on cross lane
        assert('Tilling Blocked on Orchard Cross Lane', !checkCross.valid, checkCross.reason);

        const checkTerrace = fm.canTill(0, -25); // on homestead terrace
        assert('Tilling Blocked on Homestead Knoll Terrace', !checkTerrace.valid, checkTerrace.reason);

        const checkWell = fm.canTill(-16, -8); // stone well center
        assert('Tilling Blocked inside Stone Well Plaza', !checkWell.valid, checkWell.reason);

        const checkTree = fm.canTill(14, -43); // tree trunk location
        assert('Tilling Blocked in Proximity to Tree Roots', !checkTree.valid, checkTree.reason);

        const checkMeadow = fm.canTill(-6, 2); // open meadow grass
        assert('Tilling Allowed on Clear Meadow Grass', checkMeadow.valid === true);

        // 3. Tilling Mechanics & Stamina
        p.stamina = 100;
        const tillOk = fm.tillTile(-6, 2, p);
        assert('Tilling Successfully Creates 1x1m Farmland Tile', tillOk === true && fm.tiles.has('-6_2'));
        assert('Tilling Farmland Consumes 8 Stamina', p.stamina === 92, 'Stamina: ' + p.stamina);
        const tile1 = fm.tiles.get('-6_2');
        assert('Newly Tilled Tile is Dry Soil', tile1.isTilled === true && tile1.isWatered === false);

        const tillDuplicate = fm.tillTile(-6, 2, p);
        assert('Cannot Till Already Tilled Farmland', tillDuplicate === false);

        // 4. Planting Mechanics
        const initialCarrotSeeds = p.getItemCount('seed_carrot');
        const plantCarrot = fm.plantCrop(tile1, 'carrot', p);
        assert('Planting Carrot Consumes 1 Seed', plantCarrot === true && p.getItemCount('seed_carrot') === initialCarrotSeeds - 1);
        assert('Planted Crop Starts at Stage 1 (Seedling)', tile1.crop && tile1.crop.type === 'carrot' && tile1.crop.stage === 1);
        assert('Crop Stage 1 3D Mesh Added to Scene', !!tile1.cropGroup && tile1.cropGroup.children.length > 0);

        const plantAgain = fm.plantCrop(tile1, 'carrot', p);
        assert('Cannot Plant in Already Occupied Tile', plantAgain === false);

        // 5. Watering Can Mechanics & Well Refill
        p.stamina = 100;
        const waterOk = fm.waterTile(tile1, p);
        assert('Watering Can Waters Soil Tile', waterOk === true && tile1.isWatered === true);
        assert('Watering Drains 1 Water Charge & 4 Stamina', fm.wateringCanCurrent === 11 && p.stamina === 96, 'Water: ' + fm.wateringCanCurrent + ', Stam: ' + p.stamina);

        const waterAgainToday = fm.waterTile(tile1, p);
        assert('Cannot Rewatere Already Moist Tile on Same Day', waterAgainToday === false);

        // Deplete watering can to 0
        fm.wateringCanCurrent = 0;
        fm.tillTile(-6, 3, p);
        const tile2 = fm.tiles.get('-6_3');
        const waterDryCan = fm.waterTile(tile2, p);
        assert('Watering Fails when Can is Empty (0/12)', waterDryCan === false);

        // Refill at Stone Well
        const wellInteractable = w.interactables.find(i => i.id === 'stone_well');
        assert('Stone Well Interactable Exists in World', !!wellInteractable);
        wellInteractable.interact(p);
        assert('Stone Well Refills Watering Can to 12/12', fm.wateringCanCurrent === 12);

        // 6. Multi-Crop Diversity & Growth across Daily Rollovers
        // Till and plant Wheat at (-6, 4), Pumpkin at (-6, 5), Tomato at (-6, 6)
        fm.tillTile(-6, 4, p);
        fm.tillTile(-6, 5, p);
        fm.tillTile(-6, 6, p);

        const tileWheat = fm.tiles.get('-6_4');
        const tilePumpkin = fm.tiles.get('-6_5');
        const tileTomato = fm.tiles.get('-6_6');

        fm.plantCrop(tileWheat, 'wheat', p);
        fm.plantCrop(tilePumpkin, 'pumpkin', p);
        fm.plantCrop(tileTomato, 'tomato', p);

        // Water all 4 tiles
        fm.waterTile(tile1, p); // already watered today
        fm.waterTile(tileWheat, p);
        fm.waterTile(tilePumpkin, p);
        fm.waterTile(tileTomato, p);

        assert('All 4 Test Tiles Are Watered', tile1.isWatered && tileWheat.isWatered && tilePumpkin.isWatered && tileTomato.isWatered);

        // Advance Day 1 -> Day 2 via timeManager dayRollover
        tm.day += 1;
        window.dispatchEvent(new CustomEvent('time:dayRollover', { detail: { day: tm.day, season: tm.season } }));

        assert('Soil Dries Out After Day Rollover', !tile1.isWatered && !tileWheat.isWatered && !tilePumpkin.isWatered && !tileTomato.isWatered);
        assert('Carrot Advanced to Stage 2 on Day 2', tile1.crop.stage === 2);
        assert('Wheat Advanced to Stage 2 on Day 2', tileWheat.crop.stage === 2);
        assert('Pumpkin Advanced to Stage 2 on Day 2', tilePumpkin.crop.stage === 2);
        assert('Tomato Advanced to Stage 2 on Day 2', tileTomato.crop.stage === 2);

        // Unwatered tile growth pause check: leave tileWheat dry, water Carrot, Pumpkin, Tomato
        fm.waterTile(tile1, p);
        fm.waterTile(tilePumpkin, p);
        fm.waterTile(tileTomato, p);

        // Advance Day 2 -> Day 3
        tm.day += 1;
        window.dispatchEvent(new CustomEvent('time:dayRollover', { detail: { day: tm.day, season: tm.season } }));

        assert('Unwatered Wheat Paused Growth (Remains Stage 2)', tileWheat.crop.stage === 2);
        assert('Watered Carrot Matured to Stage 4 (Ready to Harvest)', tile1.crop.stage === 4);
        assert('Watered Pumpkin Advanced to Stage 3', tilePumpkin.crop.stage === 3);
        assert('Watered Tomato Advanced to Stage 3', tileTomato.crop.stage === 3);

        // 7. Harvesting Single-Harvest Crop (Carrot: yield 2)
        const preCarrots = p.getItemCount('carrot');
        const harvestCarrot = fm.harvestCrop(tile1, p);
        assert('Harvesting Mature Carrot Yields +2 Carrots to Backpack', harvestCarrot === true && p.getItemCount('carrot') === preCarrots + 2);
        assert('Carrot Tile Preserves Tilled Soil After Harvest', tile1.isTilled === true && tile1.crop === null);

        // Advance Pumpkin & Tomato to Stage 4
        fm.waterTile(tilePumpkin, p);
        fm.waterTile(tileTomato, p);
        tm.day += 1;
        window.dispatchEvent(new CustomEvent('time:dayRollover', { detail: { day: tm.day, season: tm.season } }));

        assert('Tomato Matured to Stage 4 (Ready to Harvest)', tileTomato.crop.stage === 4);

        // 8. Regrowing Crop Mechanics (Tomato: yield 3, returns to Stage 2)
        const preTomatoes = p.getItemCount('tomato');
        const harvestTomato = fm.harvestCrop(tileTomato, p);
        assert('Harvesting Tomato Yields +3 Tomatoes', harvestTomato === true && p.getItemCount('tomato') === preTomatoes + 3);
        assert('Regrowing Tomato Resets to Stage 2 Foliage', tileTomato.crop !== null && tileTomato.crop.stage === 2);

        // 9. Sickle Clearing Tool
        fm.activeToolIndex = 3; // Sickle
        const clearTile = fm.clearTile(tileTomato, p);
        assert('Sickle Clears Farmland Tile from Scene & Grid', clearTile === true && !fm.tiles.has('-6_6'));

        // 10. Emergency Seed Supply Bin
        const initialWheat = p.getItemCount('seed_wheat');
        p.removeFromBackpack('seed_wheat', initialWheat); // empty wheat seeds
        assert('Player Emptied Wheat Seeds to 0', p.getItemCount('seed_wheat') === 0);

        const seedBin = w.interactables.find(i => i.id === 'emergency_seed_supply');
        assert('Emergency Seed Bin Interactable Exists', !!seedBin);
        seedBin.interact(p);
        assert('Emergency Seed Bin Replenished Wheat Seeds (+4)', p.getItemCount('seed_wheat') === 4);

        // 11. Tutorial Progression & Skipping
        fm.tutorial.step = 1;
        fm.advanceTutorial(2);
        assert('Tutorial Advances from Step 1 to Step 2', fm.tutorial.step === 2);
        fm.advanceTutorial(3);
        assert('Tutorial Advances to Step 3', fm.tutorial.step === 3);
        fm.skipTutorial();
        assert('Tutorial Skip Marks Skipped True', fm.tutorial.skipped === true);

        // 12. Save System Version 2 Schema & Migration
        const savePayload = sm.createSavePayload();
        assert('Save Payload Uses Schema Version 2', savePayload.schemaVersion === 2);
        assert('Save Payload Contains Farming State', !!savePayload.farming && Array.isArray(savePayload.farming.tiles));
        assert('Save Payload Contains Tools & Capacity', savePayload.farming.tools.wateringCan.max === 12);

        // Test V1 -> V2 Migration Function
        const legacyV1Save = {
          schemaVersion: 1,
          savedAt: Date.now() - 10000,
          player: {
            position: { x: 0, y: 1.2, z: 0 },
            yaw: 0, pitch: 0, stamina: 100,
            backpack: [{ id: 'apple', count: 3 }]
          },
          world: { crops: {}, fruits: {} },
          time: { day: 1, season: 0, hour: 8, minute: 0 }
        };

        const migrated = sm.migrate(legacyV1Save);
        assert('Legacy V1 Save Migrates to Schema Version 2', migrated.schemaVersion === 2);
        assert('Migrated Save Injects Farming Tool State', !!migrated.farming && migrated.farming.tools.activeToolIndex === 0);
        assert('Migrated Save Injects Starter Seeds into Backpack', migrated.player.backpack.some(i => i.id === 'seed_carrot' && i.count === 6));

        // Full Save/Load Roundtrip with Active Farm
        const saved = sm.save('qa_phase3');
        assert('SaveManager.save() Returns True for Phase 3', saved === true);

        // Clear in-memory farm
        fm.tiles.clear();
        assert('In-memory Farm Cleared to 0 Tiles', fm.tiles.size === 0);

        const loaded = sm.load();
        assert('SaveManager.load() Successfully Restores Saved Payload', !!loaded);
        fm.restoreState(loaded.farming);
        assert('Restored Farm Recovered Active Tiles', fm.tiles.size > 0);

        // Framerate test over 60 frames
        let frames = 0;
        const start = performance.now();
        while (frames < 60) {
          await new Promise(r => requestAnimationFrame(r));
          frames++;
        }
        const fps = Math.round((frames / (performance.now() - start)) * 1000);
        results.fps = fps;
        assert('Framerate Meets 60+ FPS Target', fps >= 60, fps + ' FPS');

        return results;
      })()
    `,
    awaitPromise: true,
    returnByValue: true
  });

  if (evaluation.exceptionDetails) {
    console.error('Browser Evaluation Exception:', evaluation.exceptionDetails);
    process.exit(1);
  }

  const report = evaluation.result.value;
  if (!report || report.error) {
    console.error('Evaluation Error in Page:', report);
    process.exit(1);
  }

  console.log('\n=== PHASE 3 FARMING COMPREHENSIVE AUTOMATED QA REPORT ===');
  report.checks.forEach(c => {
    console.log(`[${c.status}] ${c.name} ${c.details ? '(' + c.details + ')' : ''}`);
  });
  console.log(`\nOverall: ${report.passCount} PASSED, ${report.failCount} FAILED`);
  console.log(`Measured Performance: ${report.fps} FPS`);

  if (report.failCount > 0) {
    process.exit(1);
  }
} catch (err) {
  console.error('Test execution failed:', err);
  process.exit(1);
} finally {
  chrome.kill();
}
