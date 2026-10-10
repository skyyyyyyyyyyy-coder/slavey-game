import { spawn } from 'child_process';

const chromePath = 'C:\\Users\\chlov\\AppData\\Local\\ms-playwright\\chromium-1234\\chrome-win64\\chrome.exe';

async function testSave() {
  console.log('=== VERIFYING SAVE/LOAD PERSISTENCE FOR 12 BLENDER TREES ===\n');

  const chrome = spawn(chromePath, [
    '--headless=new',
    '--no-sandbox',
    '--window-size=1280,720',
    '--remote-debugging-port=9335',
    'http://localhost:5174/?started=1'
  ], { stdio: 'ignore' });

  await new Promise(r => setTimeout(r, 2200));

  try {
    const res = await fetch('http://127.0.0.1:9335/json');
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
      expression: 'new Promise(r => setTimeout(r, 1600))',
      awaitPromise: true
    });

    const testResult = await send('Runtime.evaluate', {
      expression: `(() => {
        // Pick apples on Tree 0 Fruit 0, Tree 4 Fruit 2, and Tree 11 Fruit 3
        const f1 = window.world.interactables.find(i => i.id === 'apple_tree_0_fruit_0');
        const f2 = window.world.interactables.find(i => i.id === 'apple_tree_4_fruit_2');
        const f3 = window.world.interactables.find(i => i.id === 'apple_tree_11_fruit_3');

        f1.interact(window.player);
        f2.interact(window.player);
        f3.interact(window.player);

        // Advance f2 slightly (5 seconds into cooldown)
        f2.growTimer = 10.0; // 5 seconds elapsed out of 15

        // Save game
        const saveOk = window.saveManager.save();
        const savedData = JSON.parse(localStorage.getItem(window.saveManager.storageKey));

        // Verify saved fruits
        const sFruits = savedData?.world?.fruits;
        const f1Saved = sFruits?.['apple_tree_0_fruit_0'];
        const f2Saved = sFruits?.['apple_tree_4_fruit_2'];
        const f3Saved = sFruits?.['apple_tree_11_fruit_3'];

        // Now test restore
        // Artificially reset f2 to ready=true
        f2.ready = true;
        f2.growTimer = 0;
        f2.mesh.scale.set(1, 1, 1);

        // Call restore
        window.world.restoreCropsAndFruits(savedData.world.crops, savedData.world.fruits);

        const f2RestoredReady = f2.ready;
        const f2RestoredTimer = f2.growTimer;
        const f2RestoredScale = f2.mesh ? f2.mesh.scale.x : null;
        const f2RestoredVisible = f2.mesh ? f2.mesh.visible : null;

        return {
          saveOk,
          schemaVersion: savedData?.schemaVersion,
          f1Saved,
          f2Saved,
          f3Saved,
          restoreTest: {
            f2RestoredReady,
            f2RestoredTimer,
            f2RestoredScale,
            f2RestoredVisible
          }
        };
      })()`,
      returnByValue: true
    });

    console.log('SAVE/RESTORE RESULT:', JSON.stringify(testResult.result.value, null, 2));

    ws.close();
    chrome.kill();
  } catch (err) {
    console.error('Error during save test:', err);
    chrome.kill();
  }
}

testSave();
