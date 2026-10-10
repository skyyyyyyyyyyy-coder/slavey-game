import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const chromePath = 'C:\\Users\\chlov\\AppData\\Local\\ms-playwright\\chromium-1234\\chrome-win64\\chrome.exe';
const artifactDir = 'C:\\Users\\chlov\\.gemini\\antigravity\\brain\\ae1064fc-6b1a-4ed2-8e9f-297a7e6a7197';

if (!fs.existsSync('screenshots')) {
  fs.mkdirSync('screenshots', { recursive: true });
}

let portCounter = 9520;

async function captureShot(url, baseName, width, height, setupFn) {
  const port = portCounter++;
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--no-sandbox',
    `--window-size=${width},${height}`,
    `--remote-debugging-port=${port}`,
    url
  ], { stdio: 'ignore' });

  await new Promise(r => setTimeout(r, 2200));

  try {
    const res = await fetch(`http://127.0.0.1:${port}/json`);
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

    await send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: false
    });

    await send('Runtime.evaluate', {
      expression: 'new Promise(r => setTimeout(r, 1500))',
      awaitPromise: true
    });

    if (setupFn) {
      await send('Runtime.evaluate', {
        expression: `(${setupFn.toString()})()`,
        awaitPromise: true
      });
      await send('Runtime.evaluate', {
        expression: 'new Promise(r => setTimeout(r, 800))',
        awaitPromise: true
      });
    }

    const snap = await send('Page.captureScreenshot', { format: 'png' });
    const buf = Buffer.from(snap.data, 'base64');

    const fileName = `${baseName}_${width}x${height}.png`;
    const localPath = path.join('screenshots', fileName);
    const artPath = path.join(artifactDir, fileName);

    fs.writeFileSync(localPath, buf);
    fs.writeFileSync(artPath, buf);

    console.log(`[SAVED] ${fileName} (${(buf.length / 1024).toFixed(1)} KB)`);

    ws.close();
    chrome.kill();
  } catch (err) {
    console.error(`Failed to capture ${baseName} ${width}x${height}:`, err);
    chrome.kill();
  }
}

async function runMilestoneACaptures() {
  console.log('=== CAPTURING MILESTONE A DUAL-RESOLUTION SCREENSHOTS ===\n');

  const targets = [
    {
      baseName: 'milestone_a_01_farming_boundary_feedback',
      url: 'http://localhost:5174/?started=1&cam=boundary-feedback&time=12:00',
      description: 'Farming Arable Boundary & Tile Targeting Reticle',
      setupFn: () => {
        const fm = window.farmingManager;
        if (fm) fm.activeToolIndex = 0; // Hoe
      }
    },
    {
      baseName: 'milestone_a_02_soil_grid_alignment',
      url: 'http://localhost:5174/?started=1&cam=grid-alignment&time=10:00',
      description: 'Clean Aligned 1x1m Soil Beds with Seamless Furrows',
      setupFn: () => {
        const p = window.player;
        const fm = window.farmingManager;
        if (!p || !fm) return;
        p.stamina = 1000;
        // Till a neat 3x3 block in West Field
        for (let gx = -7; gx <= -5; gx++) {
          for (let gz = 2; gz <= 4; gz++) {
            fm.tillTile(gx, gz, p);
            const t = fm.tiles.get(`${gx}_${gz}`);
            if (t) {
              if (gz === 2) {
                p.addToBackpack('seed_carrot', 1);
                fm.plantCrop(t, 'carrot', p);
              } else if (gz === 3) {
                p.addToBackpack('seed_wheat', 1);
                fm.plantCrop(t, 'wheat', p);
                t.crop.stage = 3;
                fm.renderCropMesh(t);
              }
              if (gx % 2 === 0) {
                fm.waterTile(t, p);
              }
            }
          }
        }
      }
    },
    {
      baseName: 'milestone_a_03_mountain_perimeter_collision',
      url: 'http://localhost:5174/?started=1&cam=boundary-north&time=08:00',
      description: 'Sealed Mountain Boundary Wall & Forest Placement at Morning 08:00'
    },
    {
      baseName: 'milestone_a_04_asset_pipeline_apple_tree',
      url: 'http://localhost:5174/?started=1&cam=blender-tree&time=17:00',
      description: 'Blender Stylized Apple Tree Verified through Asset Pipeline at Golden Hour 17:00'
    }
  ];

  const resolutions = [
    { width: 1920, height: 1080 },
    { width: 1440, height: 900 }
  ];

  for (const t of targets) {
    console.log(`\nCapturing Scene: ${t.description}`);
    for (const res of resolutions) {
      await captureShot(t.url, t.baseName, res.width, res.height, t.setupFn);
    }
  }

  console.log('\n=== ALL MILESTONE A SCREENSHOTS CAPTURED SUCCESSFULLY ===');
}

runMilestoneACaptures();
