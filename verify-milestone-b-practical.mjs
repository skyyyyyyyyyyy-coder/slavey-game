import { spawn } from 'child_process';

const chromePath = 'C:\\Users\\chlov\\AppData\\Local\\ms-playwright\\chromium-1234\\chrome-win64\\chrome.exe';
const testPort = 9270;

console.log('=== MILESTONE B PRACTICAL VERIFICATION PRE-CHECK ===\n');

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

  await send('Runtime.evaluate', {
    expression: 'new Promise(r => setTimeout(r, 3000))',
    awaitPromise: true
  });

  const checkResult = await send('Runtime.evaluate', {
    expression: `(async () => {
      const results = [];
      function pass(name, cond, msg = '') {
        results.push({ name, pass: !!cond, msg: String(msg) });
      }

      const p = window.player;
      const w = window.world;
      const cw = w.world; // CollisionWorld

      // 1. Stair Traversal Check
      // Ascend from yard (0, 0.60, -25.5) to porch (0, 1.50, -28.0)
      p.position.set(0, 0.60, -25.5);
      p.velocity.set(0, 0, 0);
      let ascendGrounded = true;
      for (let i = 0; i < 50; i++) {
        p.position.z -= 0.05;
        cw.resolveMovement(p, 0.016);
        if (!p.onGround) ascendGrounded = false;
      }
      const ascentOk = Math.abs(p.position.y - 1.50) < 0.08 && ascendGrounded;
      pass('Stair Traversal: Ascent from Yard to Porch', ascentOk, 'Y: ' + p.position.y.toFixed(2));

      // Descend from porch (0, 1.50, -28.0) to yard (0, 0.60, -25.5)
      let descendGrounded = true;
      for (let i = 0; i < 50; i++) {
        p.position.z += 0.05;
        cw.resolveMovement(p, 0.016);
        if (!p.onGround) descendGrounded = false;
      }
      const descentOk = Math.abs(p.position.y - 0.60) < 0.08 && descendGrounded;
      pass('Stair Traversal: Descent from Porch to Yard', descentOk, 'Y: ' + p.position.y.toFixed(2));

      // 2. Door Opening, Closing, Entry, Exit
      const frontDoor = w.interactables.find(i => i.id === 'house_front_door');
      pass('Front Door Interactable Registered', !!frontDoor);
      
      // Enter house via front door
      p.respawn(new THREE.Vector3(0, 1.2, -28.0));
      frontDoor.interact(p);
      await new Promise(r => setTimeout(r, 650));
      pass('Door Enters Interior at isolated coordinates', Math.hypot(p.position.x - 160, p.position.z - 161.5) < 1.0, 'Pos: ' + p.position.x.toFixed(1) + ', ' + p.position.z.toFixed(1));

      // Exit house back to porch
      const exitDoor = w.interactables.find(i => i.id === 'house_exit_door');
      pass('Interior Exit Door Interactable Registered', !!exitDoor);
      exitDoor.interact(p);
      await new Promise(r => setTimeout(r, 650));
      pass('Exit Door Returns Player to Porch Deck (0, 1.50, -28.2)', Math.hypot(p.position.x - 0, p.position.z - (-28.2)) < 0.8 && p.position.y >= 1.40, 'Y: ' + p.position.y.toFixed(2));

      // 3. Interior Collision & Interactions
      p.respawn(new THREE.Vector3(160, 1.2, 161.5));
      cw.resolveMovement(p, 0.016);
      pass('Interior Floor Colliders Prevent Void Fall', p.position.y >= 0.40, 'Y: ' + p.position.y.toFixed(2));

      const bed = w.interactables.find(i => i.id === 'house_bed');
      const fireplace = w.interactables.find(i => i.id === 'house_fireplace');
      const chest = w.interactables.find(i => i.id === 'house_chest');
      pass('Quilted Bed Interactable Exists', !!bed);
      pass('Fireplace Interactable Exists', !!fireplace);
      pass('Storage Chest Interactable Exists', !!chest);

      // Test Fireplace toggle
      const initFire = w.isFireLit;
      fireplace.interact(p);
      pass('Fireplace Toggles State', w.isFireLit !== initFire);
      fireplace.interact(p); // Toggle back

      // Test Bed interaction
      const initDay = window.timeManager.day;
      bed.interact(p);
      await new Promise(r => setTimeout(r, 950));
      pass('Bed Advances Time to 06:00 AM & Advances Day', window.timeManager.hour === 6 && window.timeManager.day === initDay + 1, 'Hour: ' + window.timeManager.hour + ', Day: ' + window.timeManager.day);

      // 4. Save/Reload Functionality
      const sm = window.saveManager;
      pass('SaveManager Active', !!sm);
      const savePayload = sm.createSavePayload();
      pass('Save Payload Generated with Schema v2', savePayload && savePayload.schemaVersion === 2);
      pass('Save Payload Serializes World House State', savePayload && savePayload.world && savePayload.world.house !== undefined);

      return results;
    })()`,
    awaitPromise: true,
    returnByValue: true
  });

  if (checkResult.exceptionDetails) {
    console.error('Browser Exception:', checkResult.exceptionDetails);
    process.exit(1);
  }
  const tests = checkResult.result.value || [];
  console.log('Returned tests count:', Array.isArray(tests) ? tests.length : typeof tests);
  let passed = 0;
  let failed = 0;
  tests.forEach(t => {
    if (t.pass) {
      console.log(`  ✓ [PASS] ${t.name} ${t.msg ? '(' + t.msg + ')' : ''}`);
      passed++;
    } else {
      console.log(`  ✗ [FAIL] ${t.name} -> ${t.msg}`);
      failed++;
    }
  });

  console.log(`\nPRE-CHECK RESULT: ${passed} PASSED, ${failed} FAILED (${tests.length} TOTAL)\n`);

  ws.close();
  chrome.kill();
  if (failed > 0) process.exit(1);
} catch (e) {
  console.error('Pre-check error:', e);
  chrome.kill();
  process.exit(1);
}
