import { spawn } from 'child_process';

const chromePath = 'C:\\Users\\chlov\\AppData\\Local\\ms-playwright\\chromium-1234\\chrome-win64\\chrome.exe';
const chrome = spawn(chromePath, [
  '--headless=new',
  '--no-sandbox',
  '--window-size=1280,720',
  '--remote-debugging-port=9321',
  'http://localhost:5174/?started=1'
], { stdio: 'ignore' });

async function run() {
  await new Promise(r => setTimeout(r, 2500));
  const tabsRes = await fetch('http://127.0.0.1:9321/json');
  const tabs = await tabsRes.json();
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

  // Wait an extra second for all async assets to load
  await new Promise(r => setTimeout(r, 2000));

  const evalRes = await send('Runtime.evaluate', {
    awaitPromise: true,
    expression: `(async () => {
      const results = {};

      // 1. Check all model files in cache / pipeline
      const modelsToTest = [
        '/models/tree_spruce.glb',
        '/models/tree_birch.glb',
        '/models/shrub_bush.glb',
        '/models/farm_well.glb',
        '/models/fence_segment.glb',
        '/models/apple_tree.glb',
        '/models/crop_carrot.glb',
        '/models/farm_soil_tile.glb'
      ];

      results.models = {};
      for (const mPath of modelsToTest) {
        try {
          const res = await window.assetPipeline.loadModel(mPath, { collision: 'none' });
          let meshCount = 0;
          let triCount = 0;
          res.model.traverse(c => {
            if (c.isMesh) {
              meshCount++;
              if (c.geometry && c.geometry.attributes && c.geometry.attributes.position) {
                triCount += (c.geometry.index ? c.geometry.index.count : c.geometry.attributes.position.count) / 3;
              }
            }
          });
          results.models[mPath] = { success: true, meshes: meshCount, triangles: Math.round(triCount) };
        } catch (err) {
          results.models[mPath] = { success: false, error: err.message };
        }
      }

      // 2. Scene interactables
      const world = window.world;
      results.interactables = world?.interactables?.map(i => ({
        id: i.id,
        name: i.name,
        prompt: i.prompt,
        hasMesh: !!i.mesh
      })) || [];

      // 3. Renderer stats
      const renderer = window.renderer;
      if (renderer) {
        results.renderStats = {
          calls: renderer.info.render.calls,
          triangles: renderer.info.render.triangles,
          points: renderer.info.render.points,
          lines: renderer.info.render.lines,
          geometries: renderer.info.memory.geometries,
          textures: renderer.info.memory.textures
        };
      }

      // 4. Player position and state
      const player = window.player;
      if (player) {
        results.player = {
          pos: { x: player.camera.position.x, y: player.camera.position.y, z: player.camera.position.z },
          stamina: player.stamina,
          waterLiters: player.farmingManager?.waterLevelLiters
        };
      }

      // 5. Well test: trigger refill interactable
      const wellInteractable = world?.interactables?.find(i => i.id === 'stone_well');
      if (wellInteractable && player) {
        player.farmingManager.wateringCanCurrent = 4;
        const initialWater = player.farmingManager.wateringCanCurrent;
        wellInteractable.interact(player);
        results.wellTest = {
          initialWater,
          afterWater: player.farmingManager.wateringCanCurrent,
          maxWater: player.farmingManager.wateringCanMax,
          refilled: (player.farmingManager.wateringCanCurrent === player.farmingManager.wateringCanMax)
        };
      }

      // 6. Frame rate measurement over 60 frames
      results.fps = await new Promise(resolve => {
        let count = 0;
        let t0 = performance.now();
        function checkFrame() {
          count++;
          if (count >= 60) {
            let dt = performance.now() - t0;
            resolve({
              fps: Math.round((count / dt) * 1000 * 10) / 10,
              frameTimeMs: Math.round((dt / count) * 100) / 100
            });
          } else {
            requestAnimationFrame(checkFrame);
          }
        }
        requestAnimationFrame(checkFrame);
      });

      return results;
    })()`,
    returnByValue: true
  });

  console.log('=== BROWSER EVALUATION RESULTS ===');
  console.log(JSON.stringify(evalRes.result?.value, null, 2));

  chrome.kill();
}

run().catch(e => {
  console.error(e);
  chrome.kill();
});
