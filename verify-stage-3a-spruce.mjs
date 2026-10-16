import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const chromePath = 'C:\\Users\\chlov\\AppData\\Local\\ms-playwright\\chromium-1234\\chrome-win64\\chrome.exe';
const port = 9338;

const chrome = spawn(chromePath, [
  '--headless=new',
  '--no-sandbox',
  '--window-size=1920,1080',
  '--remote-debugging-port=' + port,
  'http://localhost:5174/?started=1'
], { stdio: 'ignore' });

async function run() {
  console.log('=== MEADOW VALLEY STAGE 3A CHECKPOINT A: ALPINE SPRUCE TARGETED PROOFS ===');
  await new Promise(r => setTimeout(r, 2500));

  const tabsRes = await fetch(`http://127.0.0.1:${port}/json`);
  const tabs = await tabsRes.json();
  const pageTab = tabs.find(t => t.type === 'page' || t.url.includes('localhost'));
  if (!pageTab) throw new Error('No page tab found');

  const ws = new WebSocket(pageTab.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);

  let id = 1;
  const consoleErrors = [];

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

  ws.addEventListener('message', (evt) => {
    const d = JSON.parse(evt.data);
    if (d.method === 'Runtime.exceptionThrown') {
      consoleErrors.push(d.params.exceptionDetails?.text || 'Runtime exception');
    }
    if (d.method === 'Runtime.consoleAPICalled' && d.params.type === 'error') {
      const msg = d.params.args?.map(a => a.value || a.description).join(' ');
      consoleErrors.push(msg);
    }
  });

  await send('Runtime.enable');

  async function capture(filename) {
    const res = await send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(res.data, 'base64');
    const outPath = path.join('screenshots', filename);
    fs.writeFileSync(outPath, buffer);
    console.log(`📸 Saved screenshot: ${outPath} (${(buffer.length / 1024).toFixed(1)} KB)`);
  }

  // Wait for all 3 spruce models to load
  await send('Runtime.evaluate', {
    awaitPromise: true,
    expression: `
      new Promise(async (resolve) => {
        const start = performance.now();
        while (performance.now() - start < 10000) {
          if (window.assetPipeline &&
              window.assetPipeline.cache.has('/models/tree_spruce.glb') &&
              window.assetPipeline.cache.has('/models/tree_spruce_slender.glb') &&
              window.assetPipeline.cache.has('/models/tree_spruce_broad.glb')) {
            return resolve(true);
          }
          await new Promise(r => setTimeout(r, 200));
        }
        resolve(false);
      })
    `
  });

  // Helper function to position camera in engine
  async function setCamera(x, y, z, yaw, pitch, hour = 12, min = 0) {
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          window.timeManager.setTime(${hour}, ${min});
          window.dayNightCycle.setTime(${hour} + ${min}/60);
          window.player.position.set(${x}, ${y}, ${z});
          window.player.velocity.set(0, 0, 0);
          window.player.yaw = ${yaw};
          window.player.pitch = ${pitch};
        })()
      `
    });
    await new Promise(r => setTimeout(r, 800));
  }

  // 1. Direct hero closeup of spruce at (-20.5, -38.0)
  // Spruce is at x = -20.5, z = -38.0. Place player at x = -20.5, z = -31.5 looking North (yaw = 0)
  await setCamera(-20.5, 0.8, -31.5, 0.0, 0.35, 12, 0);
  await capture('stage3a_01_spruce_hero_closeup.png');

  // 2. Golden Hour Alpenglow at 17:30 looking at the spruce canopy
  await setCamera(-20.5, 0.8, -31.5, 0.0, 0.35, 17, 30);
  await capture('stage3a_02_spruce_goldenhour_alpenglow.png');

  // 3. Multi-variant lineup looking across North Belt (-20.5, -27.5, -34.0)
  // Place player at x = -15.0, z = -32.0 looking North-West (yaw = -0.92, pitch = 0.20)
  await setCamera(-15.0, 0.8, -32.0, -0.92, 0.20, 11, 0);
  await capture('stage3a_03_spruce_variants_lineup.png');

  // 4. Wide forest belt & alpine mountain horizon from the terrace knoll
  // Place player at x = 0.0, z = -20.0 looking North (yaw = 0.0, pitch = 0.15)
  await setCamera(0.0, 0.8, -20.0, 0.0, 0.15, 16, 45);
  await capture('stage3a_04_spruce_forest_belt_wide.png');

  console.log('\nConsole Errors:', consoleErrors.length === 0 ? 'None (Clean)' : consoleErrors);

  ws.close();
  chrome.kill();
  console.log('=== TARGETED VERIFICATION COMPLETE ===');
}

run().catch(err => {
  console.error('Fatal verification error:', err);
  chrome.kill();
  process.exit(1);
});
