import { spawn } from 'child_process';

const chromePath = 'C:\\Users\\chlov\\AppData\\Local\\ms-playwright\\chromium-1234\\chrome-win64\\chrome.exe';

async function verify() {
  console.log('=== VERIFYING FULL BLENDER ORCHARD UPGRADE ===\n');

  const chrome = spawn(chromePath, [
    '--headless=new',
    '--no-sandbox',
    '--window-size=1920,1080',
    '--remote-debugging-port=9330',
    'http://localhost:5174/?started=1&cam=orchard-row&time=12:00'
  ], { stdio: 'ignore' });

  await new Promise(r => setTimeout(r, 2200));

  try {
    const res = await fetch('http://127.0.0.1:9330/json');
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

    // Wait for models to load and settle
    await send('Runtime.evaluate', {
      expression: 'new Promise(r => setTimeout(r, 1600))',
      awaitPromise: true
    });

    const evalResult = await send('Runtime.evaluate', {
      expression: `(() => {
        const fruitTrees = window.world.fruitTrees;
        const totalTrees = fruitTrees.length;
        
        // Check meshes on all trees
        let treesWithBlenderModels = 0;
        let totalFruits = 0;
        let fruitsWithMeshes = 0;
        let scaleVariations = [];
        let yawRotations = [];

        fruitTrees.forEach((t, tIdx) => {
          const hasTrunkMesh = t.group.children.some(c => c.name === 'Scene' || c.name === 'AppleTree_Master' || c.getObjectByName?.('Trunk'));
          if (hasTrunkMesh) treesWithBlenderModels++;
          scaleVariations.push(t.scaleVar);
          yawRotations.push(t.group.rotation.y);

          if (t.fruits) {
            t.fruits.forEach(f => {
              totalFruits++;
              if (f.mesh) fruitsWithMeshes++;
            });
          }
        });

        // Test Apple picking on Tree 0, Fruit 1
        const testFruit = window.world.interactables.find(i => i.id === 'apple_tree_0_fruit_1');
        const backpackBefore = window.player.backpack.find(i => i.id === 'apple')?.count || 0;
        
        let pickedOk = false;
        if (testFruit && testFruit.ready) {
          testFruit.interact(window.player);
          pickedOk = true;
        }
        const backpackAfter = window.player.backpack.find(i => i.id === 'apple')?.count || 0;

        // Check fruit state immediately after harvest
        const scaleImmediate = testFruit?.mesh ? testFruit.mesh.scale.x : null;
        const visibleImmediate = testFruit?.mesh ? testFruit.mesh.visible : null;

        // Step simulation forward slightly to let pluck shrink finish
        testFruit.update(0.3); // 300ms, pluck timer is 200ms
        const visibleAfterPluck = testFruit?.mesh ? testFruit.mesh.visible : null;

        // Step simulation to 50% regrowth (7.5s)
        testFruit.growTimer = 7.5; // 50% through
        testFruit.pluckTimer = 0;
        testFruit.update(0.01);
        const scaleMidRegrowth = testFruit?.mesh ? testFruit.mesh.scale.x : null;
        const visibleMidRegrowth = testFruit?.mesh ? testFruit.mesh.visible : null;

        // Step simulation to completion
        testFruit.growTimer = 0;
        testFruit.update(0.01);
        const scaleMatured = testFruit?.mesh ? testFruit.mesh.scale.x : null;
        const readyMatured = testFruit ? testFruit.ready : null;

        // Renderer telemetry
        const renderInfo = {
          drawCalls: window.renderer.info.render.calls,
          triangles: window.renderer.info.render.triangles,
          geometries: window.renderer.info.memory.geometries,
          textures: window.renderer.info.memory.textures
        };

        return {
          totalTrees,
          treesWithBlenderModels,
          totalFruits,
          fruitsWithMeshes,
          scaleVariations,
          yawRotations,
          harvestTest: {
            pickedOk,
            backpackBefore,
            backpackAfter,
            scaleImmediate,
            visibleImmediate,
            visibleAfterPluck,
            scaleMidRegrowth,
            visibleMidRegrowth,
            scaleMatured,
            readyMatured
          },
          renderInfo
        };
      })()`,
      returnByValue: true
    });

    console.log('AUDIT RESULT:', JSON.stringify(evalResult.result.value, null, 2));

    ws.close();
    chrome.kill();
  } catch (err) {
    console.error('Error during verification:', err);
    chrome.kill();
  }
}

verify();
