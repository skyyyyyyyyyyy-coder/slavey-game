import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const chromePath = 'C:\\Users\\chlov\\AppData\\Local\\ms-playwright\\chromium-1234\\chrome-win64\\chrome.exe';
const artifactDir = 'C:\\Users\\chlov\\.gemini\\antigravity\\brain\\843a2c15-cfea-486c-880f-bbc7ddd7c119';

if (!fs.existsSync('screenshots')) {
  fs.mkdirSync('screenshots', { recursive: true });
}
if (!fs.existsSync(artifactDir)) {
  fs.mkdirSync(artifactDir, { recursive: true });
}

let portCounter = 9810;

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
      expression: 'new Promise(r => setTimeout(r, 2200))',
      awaitPromise: true
    });

    if (setupFn) {
      await send('Runtime.evaluate', {
        expression: `(${setupFn.toString()})()`,
        awaitPromise: true
      });
      await send('Runtime.evaluate', {
        expression: 'new Promise(r => setTimeout(r, 1000))',
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

async function runMilestoneBFinalCaptures() {
  console.log('=== CAPTURING MILESTONE B FINAL HOUSE REPAIR HIGH-RES SCREENSHOTS ===\n');

  const targets = [
    {
      baseName: 'milestone_b_final_01_front_exterior',
      url: 'http://localhost:5174/?started=1&time=10:30',
      description: '1. Repaired Alpine Farmhouse Front Elevation (Porch beams, clean rafters, new glass, flower boxes)',
      setupFn: () => {
        const p = window.player;
        p.respawn(new window.THREE.Vector3(0, 1.45, -21.5));
        p.yaw = 0.0;
        p.pitch = 0.14;
      }
    },
    {
      baseName: 'milestone_b_final_02_side_rear_exterior',
      url: 'http://localhost:5174/?started=1&time=10:30',
      description: '2. Side & Rear Exterior 3/4 Perspective (Woodshed, side windows, chimney, gable trims)',
      setupFn: () => {
        const p = window.player;
        p.respawn(new window.THREE.Vector3(-10.5, 1.50, -26.0));
        p.yaw = -0.75;
        p.pitch = 0.12;
      }
    },
    {
      baseName: 'milestone_b_final_03_repaired_roof_timber',
      url: 'http://localhost:5174/?started=1&time=10:30',
      description: '3. Close-Up of Repaired Roof Timber (Rafter tails anchored to top plate, porch headers, brackets)',
      setupFn: () => {
        const p = window.player;
        p.respawn(new window.THREE.Vector3(-4.2, 1.60, -26.5));
        p.yaw = -0.35;
        p.pitch = 0.42;
      }
    },
    {
      baseName: 'milestone_b_final_04_repaired_windows',
      url: 'http://localhost:5174/?started=1&time=10:30',
      description: '4. Close-Up of Repaired Windows (Transparent tinted glass, wooden mullions, sill ledge, flower box)',
      setupFn: () => {
        const p = window.player;
        p.respawn(new window.THREE.Vector3(-3.2, 1.45, -27.2));
        p.yaw = 0.0;
        p.pitch = 0.08;
      }
    },
    {
      baseName: 'milestone_b_final_05_mountain_house_separation',
      url: 'http://localhost:5174/?started=1&time=10:30',
      description: '5. Mountain / House Separation (View from east showing clear ground, evergreen belt, majestic mountain)',
      setupFn: () => {
        const p = window.player;
        p.respawn(new window.THREE.Vector3(12.0, 1.50, -28.0));
        p.yaw = 0.95;
        p.pitch = 0.16;
      }
    },
    {
      baseName: 'milestone_b_final_06_updated_interior',
      url: 'http://localhost:5174/?started=1&time=10:30',
      description: '6. Upgraded Interior (Cedar floor, ceiling rafters with corbels, hearth details, dining table, windows)',
      setupFn: () => {
        const p = window.player;
        p.respawn(new window.THREE.Vector3(160.0, 1.30, 162.6));
        p.yaw = 0.0;
        p.pitch = -0.05;
      }
    },
    {
      baseName: 'milestone_b_final_07_porch_stairs_doorway',
      url: 'http://localhost:5174/?started=1&time=10:30',
      description: '7. Porch Stairs & Doorway Clearance (5 steps, stringers, balusters, hanging lantern, door frame)',
      setupFn: () => {
        const p = window.player;
        p.respawn(new window.THREE.Vector3(0, 1.25, -24.2));
        p.yaw = 0.0;
        p.pitch = 0.06;
      }
    }
  ];

  for (const t of targets) {
    console.log(`\nCapturing: ${t.description} (${t.baseName})`);
    // 1920x1080 Desktop Full HD
    await captureShot(t.url, t.baseName, 1920, 1080, t.setupFn);
    // 1440x900 Compact Aspect
    await captureShot(t.url, t.baseName, 1440, 900, t.setupFn);
  }

  console.log('\n=== ALL 14 FINAL REPAIR SCREENSHOTS CAPTURED SUCCESSFULLY ===');
}

runMilestoneBFinalCaptures().catch(err => {
  console.error('Fatal capture error:', err);
  process.exit(1);
});
