import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const chromePath = 'C:\\Users\\chlov\\AppData\\Local\\ms-playwright\\chromium-1234\\chrome-win64\\chrome.exe';
const artifactDir = 'C:\\Users\\chlov\\.gemini\\antigravity\\brain\\ae1064fc-6b1a-4ed2-8e9f-297a7e6a7197';

const captures = [
  { id: '01_field_overview_midday', cam: 'c1-overview', time: '12:00', title: 'Complete 3x3 Field Overview (Midday 12:00)' },
  { id: '02_field_overview_sunset', cam: 'c1-overview', time: '18:30', title: 'Complete 3x3 Field Overview (Sunset 18:30)' },
  { id: '03_stages_lineup_midday', cam: 'c1-lineup', time: '12:00', title: '4 Carrot Growth Stages Lineup (Midday 12:00)' },
  { id: '04_stages_lineup_sunset', cam: 'c1-lineup', time: '18:30', title: '4 Carrot Growth Stages Lineup (Sunset 18:30)' },
  { id: '05_carrot_closeup_midday', cam: 'c1-closeup', time: '12:00', title: 'Stage 4 Ripe Carrot Close-up (Midday 12:00)' },
  { id: '06_carrot_closeup_sunset', cam: 'c1-closeup', time: '18:30', title: 'Stage 4 Ripe Carrot Close-up (Sunset 18:30)' },
  { id: '07_soil_furrows_midday', cam: 'c1-soil', time: '12:00', title: 'Dry vs Watered Soil Furrows (Midday 12:00)' },
  { id: '08_soil_furrows_sunset', cam: 'c1-soil', time: '18:30', title: 'Dry vs Watered Soil Furrows (Sunset 18:30)' }
];

const resolutions = [
  { width: 1920, height: 1080, suffix: '1920x1080' },
  { width: 1440, height: 900, suffix: '1440x900' }
];

async function captureShot(res, cap) {
  const url = `http://localhost:5174/?started=1&cam=${cap.cam}&time=${cap.time}`;
  const port = 9330 + Math.floor(Math.random() * 50);

  const chrome = spawn(chromePath, [
    '--headless=new',
    '--no-sandbox',
    `--window-size=${res.width},${res.height}`,
    `--remote-debugging-port=${port}`,
    url
  ], { stdio: 'ignore' });

  try {
    await new Promise(r => setTimeout(r, 2200));
    const tabsRes = await fetch(`http://127.0.0.1:${port}/json`);
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

    // Wait for models to load & ensure demo field is active
    await send('Runtime.evaluate', {
      awaitPromise: true,
      expression: `(async () => {
        let attempts = 0;
        while (!window.farmingManager?.assetsLoaded && attempts < 25) {
          await new Promise(r => setTimeout(r, 100));
          attempts++;
        }
        if (window.farmingManager && window.farmingManager.tiles.size === 0) {
          window.farmingManager.createDemoField();
        }
        await new Promise(r => setTimeout(r, 500));
      })()`
    });

    // Wait an additional 600ms for stable render
    await new Promise(r => setTimeout(r, 600));

    // Capture screenshot
    const shot = await send('Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: false
    });

    const fileName = `stage_c1_${cap.id}_${res.suffix}.png`;
    const outPath = path.join(artifactDir, fileName);
    fs.writeFileSync(outPath, Buffer.from(shot.data, 'base64'));
    console.log(`[CAPTURED] ${fileName} (${res.width}x${res.height}) -> ${outPath}`);

    chrome.kill();
  } catch (err) {
    console.error(`Failed ${cap.id} at ${res.suffix}:`, err);
    chrome.kill();
  }
}

async function main() {
  console.log('=== CAPTURING STAGE C1 DUAL-RESOLUTION SCREENSHOTS ===');
  for (const cap of captures) {
    for (const res of resolutions) {
      await captureShot(res, cap);
    }
  }
  console.log('=== ALL SCREENSHOTS CAPTURED SUCCESSFULLY ===');
}

main();
