import { spawn } from 'child_process';
import fs from 'fs';

const chromePath = 'C:\\Users\\chlov\\AppData\\Local\\ms-playwright\\chromium-1234\\chrome-win64\\chrome.exe';
const testPort = 9265;

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

  // Allow world to load fully
  await send('Runtime.evaluate', {
    expression: 'new Promise(r => setTimeout(r, 3500))',
    awaitPromise: true
  });

  // Measure metrics
  const evalResult = await send('Runtime.evaluate', {
    expression: `(() => {
      const r = window.renderer;
      const fm = window.farmingManager;
      const w = window.world;
      const p = window.player;
      
      return {
        render: {
          calls: r.info.render.calls,
          triangles: r.info.render.triangles,
          lines: r.info.render.lines,
          points: r.info.render.points
        },
        memory: {
          geometries: r.info.memory.geometries,
          textures: r.info.memory.textures
        },
        farming: {
          activeTiles: fm.tiles.size,
          cropsCount: Object.keys(window.CROPS).length,
          cropDefinitions: window.CROPS,
          tools: window.TOOLS.map(t => ({ id: t.id, name: t.name })),
          selectedCrop: fm.selectedCropId,
          activeTool: window.TOOLS[fm.activeToolIndex]?.id
        },
        player: {
          pos: { x: p.position.x.toFixed(2), y: p.position.y.toFixed(2), z: p.position.z.toFixed(2) },
          stamina: p.stamina,
          backpack: p.backpack
        }
      };
    })()`,
    returnByValue: true
  });

  console.log('BASELINE METRICS:');
  console.log(JSON.stringify(evalResult.result.value, null, 2));

  // Set viewport to 1920x1080
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1,
    mobile: false
  });

  // Move player to look at West Homestead field (-7, 1.2, 3)
  await send('Runtime.evaluate', {
    expression: `(() => {
      window.player.position.set(-7, 1.2, 7);
      window.player.yaw = Math.PI; // Look North toward field
      window.player.pitch = -0.3;
      window.player.camera.rotation.set(window.player.pitch, window.player.yaw, 0, 'YXZ');
      window.renderer.render(window.scene, window.camera);
    })()`
  });

  await new Promise(r => setTimeout(r, 600));

  // Capture baseline screenshot
  const screenshot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('screenshots/baseline_c0_farmfield_1920x1080.png', Buffer.from(screenshot.data, 'base64'));
  console.log('Saved screenshots/baseline_c0_farmfield_1920x1080.png');

  ws.close();
  chrome.kill();
} catch (err) {
  console.error('Error in baseline measurement:', err);
  chrome.kill();
}
