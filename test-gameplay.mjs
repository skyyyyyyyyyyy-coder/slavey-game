import { spawn } from 'child_process';

const chromePath = 'C:\\Users\\chlov\\AppData\\Local\\ms-playwright\\chromium-1234\\chrome-win64\\chrome.exe';
const port = 9224;

console.log('Launching headless Chrome with remote debugging on port ' + port);
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
  await new Promise(r => setTimeout(r, 1000));

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

        // Check 1: Existence of player and world
        assert('Player Object Exists', !!p && !!p.position);
        assert('World Object Exists', !!w && !!w.interactables);
        assert('World Interactables Populated', w.interactables.length >= 70, 'Found: ' + w.interactables.length);

        // Check 2: Player initial spawn position and grounded state
        assert('Initial Position at Spawn', Math.abs(p.position.x) < 0.1 && Math.abs(p.position.z) < 0.1, 'Pos: ' + JSON.stringify(p.position));

        // Check 3: Walk test (Simulate W key for 20 frames)
        p.keys.forward = true;
        for (let i = 0; i < 20; i++) {
          await new Promise(r => requestAnimationFrame(r));
        }
        p.keys.forward = false;
        assert('Walking moves player forward (-Z)', p.position.z < -0.2, 'Z: ' + p.position.z.toFixed(2));

        // Check 4: Jump test (Simulate Space key for jump force)
        p.velocity.y = p.jumpForce;
        p.onGround = false;
        await new Promise(r => requestAnimationFrame(r));
        assert('Jumping makes player airborne with upward velocity', p.velocity.y > 0 && !p.onGround, 'Vy: ' + p.velocity.y.toFixed(2));

        // Let player land back on ground (wait ~900ms real time for gravity simulation)
        await new Promise(r => setTimeout(r, 900));
        assert('Player lands back on ground', p.onGround === true || p.position.y <= 0.05, 'Y: ' + p.position.y.toFixed(2) + ', Grounded: ' + p.onGround);

        // Check 5: Harvesting & Backpack test
        const initialCarrots = p.backpack.find(i => i.id === 'carrot').count;
        const carrotCrop = w.cropPlants.find(c => c.name === 'Carrot Plant');
        assert('Carrot Crop Ready for Harvest', !!carrotCrop && carrotCrop.ready === true);

        // Harvest the carrot
        carrotCrop.interact(p);
        const afterCarrots = p.backpack.find(i => i.id === 'carrot').count;
        assert('Harvesting increments Carrot count in Backpack', afterCarrots === initialCarrots + 1, 'Carrots: ' + afterCarrots);
        assert('Harvested Crop enters regrow cooldown', carrotCrop.ready === false);

        // Check 6: Apple Harvest test
        const initialApples = p.backpack.find(i => i.id === 'apple').count;
        const appleFruit = w.interactables.find(i => i.prompt === 'Pick Apple');
        assert('Apple Fruit Ready for Harvest', !!appleFruit && appleFruit.ready === true);
        appleFruit.interact(p);
        const afterApples = p.backpack.find(i => i.id === 'apple').count;
        assert('Picking Apple increments Apple count in Backpack', afterApples === initialApples + 1, 'Apples: ' + afterApples);

        // Check 7: Measure FPS over 90 frames
        let frames = 0;
        const t0 = performance.now();
        await new Promise(res => {
          function countF() {
            frames++;
            if (frames < 90) {
              requestAnimationFrame(countF);
            } else {
              res();
            }
          }
          requestAnimationFrame(countF);
        });
        const elapsed = performance.now() - t0;
        results.fps = Math.round((frames / elapsed) * 1000);
        assert('Framerate meets or exceeds 60 FPS target', results.fps >= 58, 'Measured: ' + results.fps + ' FPS');

        return results;
      })()
    `,
    awaitPromise: true,
    returnByValue: true
  });

  console.log('\n=== COMPREHENSIVE QA AUTOMATION REPORT ===');
  const resData = evaluation.result.value;
  resData.checks.forEach(c => {
    console.log(`[${c.status}] ${c.name} ${c.details ? '(' + c.details + ')' : ''}`);
  });
  console.log(`\nOverall: ${resData.passCount} PASSED, ${resData.failCount} FAILED`);
  console.log(`Measured Performance: ${resData.fps} FPS`);
  console.log('Console Logs:', consoleMessages.length > 0 ? consoleMessages.join('\n') : '(None)');

  ws.close();
} catch (err) {
  console.error('Error in test runner:', err);
} finally {
  chrome.kill();
}
