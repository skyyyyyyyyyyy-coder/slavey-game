import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const chromePath = 'C:\\Users\\chlov\\AppData\\Local\\ms-playwright\\chromium-1234\\chrome-win64\\chrome.exe';
const testPort = 9262;

console.log('=== MEADOW VALLEY SIMULATOR — MILESTONE B AUTOMATED VERIFICATION ===\n');

const chrome = spawn(chromePath, [
  '--headless=new',
  '--no-sandbox',
  `--remote-debugging-port=${testPort}`,
  'http://localhost:5174/?started=1'
], { stdio: 'ignore' });

await new Promise(r => setTimeout(r, 2200));

try {
  const res = await fetch(`http://127.0.0.1:${testPort}/json`);
  const tabs = await res.json();
  const pageTab = tabs.find(t => t.type === 'page' || t.url.includes('localhost'));
  
  if (!pageTab) {
    throw new Error('No page tab found on Chrome debug endpoint');
  }

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

  // Settle time for textures, shaders, GLBs and world loading
  await send('Runtime.evaluate', {
    expression: 'new Promise(r => setTimeout(r, 3000))',
    awaitPromise: true
  });

  const evalResult = await send('Runtime.evaluate', {
    expression: `(async () => {
      const results = [];
      function pass(name, cond, msg = '') {
        results.push({ name, pass: !!cond, msg: String(msg) });
      }

      const w = window.world;
      const p = window.player;
      const tm = window.timeManager;
      const sm = window.saveManager;
      const renderer = window.renderer;

      // ==========================================
      // SECTION 1: BLENDER FARMHOUSE EXTERIOR
      // ==========================================
      pass('World instance exists', !!w);
      pass('Farmhouse Exterior GLB model loaded into scene', !!w.farmhouseExteriorModel);
      
      const exteriorDoor = w.interactables.find(i => i.id === 'house_front_door');
      pass('House Front Door Interactable registered', !!exteriorDoor);
      pass('Exterior Door Leaf mesh node bound', !!w.farmhouseDoorLeaf);
      pass('Chimney smoke particles array active', Array.isArray(w.smokeParticles) && w.smokeParticles.length > 0);

      // Verify exterior colliders in world.colliders
      const colliders = w.world ? w.world.colliders : [];
      const exteriorSolidCols = colliders.filter(c => c.box && c.box.min.z < -20 && c.box.max.z > -45 && Math.abs(c.box.min.x) < 25);
      pass('Exterior building colliders registered in CollisionWorld', exteriorSolidCols.length >= 5, 'Found ' + exteriorSolidCols.length + ' exterior colliders');

      // ==========================================
      // SECTION 2: BLENDER COZY INTERIOR
      // ==========================================
      pass('Farmhouse Interior GLB model loaded into scene', !!w.farmhouseInteriorModel);
      pass('Interior placed at isolated coordinates (X=160, Z=160)', 
        w.farmhouseInteriorModel && Math.abs(w.farmhouseInteriorModel.position.x - 160) < 0.1 && Math.abs(w.farmhouseInteriorModel.position.z - 160) < 0.1);

      // Verify interior boundary & floor colliders
      const interiorCols = colliders.filter(c => c.box && c.box.min.x > 150 && c.box.max.x < 170 && c.box.min.z > 150 && c.box.max.z < 170);
      pass('Interior boundary & furniture colliders registered', interiorCols.length >= 6, 'Found ' + interiorCols.length + ' interior colliders');

      const floorCol = interiorCols.find(c => c.box.min.y <= -1.0 && c.box.max.y <= 0.1);
      pass('Interior solid floor collision prevents falling into void', !!floorCol);

      // Verify interior light sources
      pass('Hearth point light active', !!w.hearthLight);
      pass('Hearth light initial visibility is true', w.hearthLight && w.hearthLight.visible === true);

      // ==========================================
      // SECTION 3: INTERACTIVE GAMEPLAY SYSTEMS
      // ==========================================
      const exitDoor = w.interactables.find(i => i.id === 'house_exit_door');
      const bed = w.interactables.find(i => i.id === 'house_bed');
      const fireplace = w.interactables.find(i => i.id === 'house_fireplace');
      const chest = w.interactables.find(i => i.id === 'house_chest');

      pass('House Exit Door Interactable exists', !!exitDoor);
      pass('Quilted Bed Sleep Interactable exists', !!bed);
      pass('Fireplace Toggle Interactable exists', !!fireplace);
      pass('Storage Chest Interactable exists', !!chest);

      // 3A. Test House Entry & Exit Teleportation
      // Teleport player near front door and interact
      p.respawn(new THREE.Vector3(0, 1.2, -28.0));
      exteriorDoor.interact(p);
      // Wait for entrance fade
      await new Promise(r => setTimeout(r, 600));
      pass('Front Door enters interior at (160, 1.2, 161.5)', 
        Math.abs(p.position.x - 160) < 1.0 && Math.abs(p.position.z - 161.5) < 1.0 && p.position.y >= -0.2,
        'Player at (' + p.position.x.toFixed(1) + ', ' + p.position.y.toFixed(1) + ', ' + p.position.z.toFixed(1) + ')');

      // Exit through interior front door
      exitDoor.interact(p);
      await new Promise(r => setTimeout(r, 600));
      pass('Exit Door returns to veranda porch at (0, 1.2, -27.5)',
        Math.abs(p.position.x - 0) < 1.0 && Math.abs(p.position.z - (-27.5)) < 1.0,
        'Player at (' + p.position.x.toFixed(1) + ', ' + p.position.y.toFixed(1) + ', ' + p.position.z.toFixed(1) + ')');

      // Re-enter interior for bed, fireplace, and chest testing
      p.respawn(new THREE.Vector3(160, 1.2, 161.5));

      // 3B. Test Fireplace Toggle
      const initialFireLit = w.isFireLit;
      fireplace.interact(p);
      pass('Fireplace toggles fireLit state to opposite', w.isFireLit === !initialFireLit);
      pass('Hearth point light visibility reflects fireLit state', w.hearthLight.visible === w.isFireLit);
      pass('Fireplace prompt updates dynamically', fireplace.prompt.includes(w.isFireLit ? 'Extinguish' : 'Light'));

      // Toggle back to on
      fireplace.interact(p);
      pass('Fireplace toggles back on', w.isFireLit === true);

      // 3C. Test Bed Sleeping Mechanics (Atomic Time Advance & Stamina Restore)
      p.stamina = 25;
      p.isExhausted = true;
      tm.setTime(22, 45); // 10:45 PM
      const prevDay = tm.day;

      bed.interact(p);
      pass('Bed interaction activates isSleeping lock', w.isSleeping === true);

      // Wait for sleep transition
      await new Promise(r => setTimeout(r, 900));

      pass('Bed advances TimeManager hour to 06:00 AM', tm.hour === 6 && tm.minute === 0, 'Current time: ' + tm.hour + ':' + tm.minute);
      pass('Bed advances day count by exactly 1', tm.day === prevDay + 1, 'Previous: ' + prevDay + ', Current: ' + tm.day);
      pass('Bed restores Player stamina to 100%', p.stamina === 100);
      pass('Bed clears exhausted status', p.isExhausted === false);
      pass('Bed releases isSleeping lock after transition', w.isSleeping === false);

      // 3D. Test Storage Chest Mechanics (16 Slots & Atomic Transfer)
      pass('World chestItems array has items', Array.isArray(w.chestItems) && w.chestItems.length > 0);
      pass('World interiorChestLid node bound', !!w.interiorChestLid);

      const storageModal = document.getElementById('storage-modal');
      pass('Storage modal element exists in DOM', !!storageModal);

      // Open chest
      chest.interact(p);
      pass('Chest lid animates open', w.interiorChestLid.rotation.x < -0.4);
      pass('Storage modal visible on screen', !storageModal.classList.contains('hidden'));

      // Test atomic item transfer (Chest -> Backpack)
      const testItem = w.chestItems[0];
      const initialChestCount = testItem.count;
      const initialBackpackCount = p.getItemCount(testItem.id);

      // Simulate clicking first slot in chest UI
      const firstSlotCell = document.querySelector('.chest-slot-cell:not(.empty)');
      pass('Rendered chest slot cell in UI', !!firstSlotCell);
      firstSlotCell.click();

      const newChestCount = testItem.count;
      const newBackpackCount = p.getItemCount(testItem.id);
      pass('Chest slot count decremented by 1', newChestCount === initialChestCount - 1, 'Was ' + initialChestCount + ', now ' + newChestCount);
      pass('Player backpack count incremented by 1', newBackpackCount === initialBackpackCount + 1, 'Was ' + initialBackpackCount + ', now ' + newBackpackCount);
      pass('Total item count strictly conserved (no duplication, no loss)', 
        (newChestCount + newBackpackCount) === (initialChestCount + initialBackpackCount));

      // Test atomic item transfer (Backpack -> Chest)
      const bpCard = document.querySelector('.backpack-transfer-card');
      pass('Rendered backpack transfer card in UI', !!bpCard);
      bpCard.click();

      pass('Item returned to chest with total count conserved',
        (testItem.count + p.getItemCount(testItem.id)) === (initialChestCount + initialBackpackCount));

      // Close storage modal
      const btnCloseStorage = document.getElementById('btn-close-storage');
      btnCloseStorage.click();
      pass('Storage modal hidden after closing', storageModal.classList.contains('hidden'));
      pass('Chest lid closes back to 0 rotation', Math.abs(w.interiorChestLid.rotation.x) < 0.05);

      // ==========================================
      // SECTION 4: SAVE / LOAD COMPATIBILITY
      // ==========================================
      w.isFireLit = false;
      w.chestItems = [
        { id: 'apple', name: 'Fresh Apple', icon: '🍎', count: 12 },
        { id: 'carrot', name: 'Farm Carrot', icon: '🥕', count: 8 }
      ];

      const savePayload = sm.createSavePayload();
      pass('Save payload schema version is 2', savePayload.schemaVersion === 2);
      pass('Save payload serializes world.house', !!savePayload.world.house);
      pass('Save payload serializes house.fireLit = false', savePayload.world.house.fireLit === false);
      pass('Save payload serializes 2 chest items', savePayload.world.house.chest.length === 2);

      // Test restoration
      w.isFireLit = true;
      w.chestItems = [];
      w.restoreHouseState(savePayload.world.house);
      pass('restoreHouseState restores fireLit to false', w.isFireLit === false);
      pass('restoreHouseState restores chest items array', w.chestItems.length === 2 && w.chestItems[0].count === 12);

      // Restore fire for visual testing
      w.isFireLit = true;
      if (w.hearthLight) w.hearthLight.visible = true;

      // ==========================================
      // SECTION 5: PERFORMANCE & RENDERING BUDGET
      // ==========================================
      renderer.render(w.scene, p.camera);
      const renderInfo = renderer.info.render;
      pass('Draw calls within budget (< 1200)', renderInfo.calls < 1200, 'Calls: ' + renderInfo.calls);
      pass('Triangles within budget (< 300,000)', renderInfo.triangles < 300000, 'Triangles: ' + renderInfo.triangles);
      pass('Textures in memory reasonable (< 50)', renderer.info.memory.textures < 50, 'Textures: ' + renderer.info.memory.textures);

      return results;
    })()`,
    awaitPromise: true,
    returnByValue: true
  });

  if (evalResult.exceptionDetails) {
    console.error('Browser Evaluation Exception:', JSON.stringify(evalResult.exceptionDetails, null, 2));
  }
  const tests = evalResult.result?.value || [];
  console.log(`Ran ${tests.length} automated verification checks for Milestone B:\n`);

  let passed = 0;
  let failed = 0;

  for (const t of tests) {
    if (t.pass) {
      console.log(`  ✓ [PASS] ${t.name}${t.msg ? ' — ' + t.msg : ''}`);
      passed++;
    } else {
      console.log(`  ✗ [FAIL] ${t.name}${t.msg ? ' — ' + t.msg : ''}`);
      failed++;
    }
  }

  console.log(`\n========================================`);
  console.log(`RESULTS: ${passed} PASSED, ${failed} FAILED (${tests.length} TOTAL)`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exitCode = 1;
  }
} catch (err) {
  console.error('Verification failed with error:', err);
  process.exitCode = 1;
} finally {
  chrome.kill();
}
