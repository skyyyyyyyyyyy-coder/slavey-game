import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const chromePath = 'C:\\Users\\chlov\\AppData\\Local\\ms-playwright\\chromium-1234\\chrome-win64\\chrome.exe';

async function captureShot(url, outputFile) {
  const port = 9340 + Math.floor(Math.random() * 50);
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--no-sandbox',
    '--window-size=1920,1080',
    '--remote-debugging-port=' + port,
    url
  ], { stdio: 'ignore' });

  await new Promise(r => setTimeout(r, 2600));
  const tabsRes = await fetch(`http://127.0.0.1:${port}/json`);
  const tabs = await tabsRes.json();
  const pageTab = tabs.find(t => t.type === 'page' || t.url.includes('localhost'));
  if (!pageTab) {
    chrome.kill();
    throw new Error('No page tab found');
  }

  const ws = new WebSocket(pageTab.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);

  function send(method, params = {}) {
    return new Promise(resolve => {
      const curId = Math.floor(Math.random() * 1000000);
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

  // Ensure assets are loaded
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

  await new Promise(r => setTimeout(r, 1200));
  const snap = await send('Page.captureScreenshot', { format: 'png' });
  const outPath = path.join('screenshots', outputFile);
  fs.writeFileSync(outPath, Buffer.from(snap.data, 'base64'));
  console.log(`📸 Saved screenshot: ${outPath} (${(snap.data.length * 0.75 / 1024).toFixed(1)} KB)`);

  ws.close();
  chrome.kill();
}

async function runAll() {
  console.log('=== CAPTURING STAGE 3A CHECKPOINT A SCREENSHOTS ===');
  await captureShot('http://localhost:5174/?started=1&cam=boundary-north&time=midday', 'stage3a_01_spruce_boundary_north_midday.png');
  await captureShot('http://localhost:5174/?started=1&cam=boundary-north&time=goldenhour', 'stage3a_02_spruce_boundary_north_goldenhour.png');
  await captureShot('http://localhost:5174/?started=1&cam=spruce-closeup&time=midday', 'stage3a_03_spruce_hero_closeup.png');
  await captureShot('http://localhost:5174/?started=1&cam=spruce-lineup&time=goldenhour', 'stage3a_04_spruce_variants_lineup.png');
  console.log('=== ALL SCREENSHOTS CAPTURED SUCCESSFULLY ===');
}

runAll().catch(err => {
  console.error('Capture error:', err);
  process.exit(1);
});
