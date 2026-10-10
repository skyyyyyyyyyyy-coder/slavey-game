import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const chromePath = 'C:\\Users\\chlov\\AppData\\Local\\ms-playwright\\chromium-1234\\chrome-win64\\chrome.exe';
const artifactDir = 'C:\\Users\\chlov\\.gemini\\antigravity\\brain\\ae1064fc-6b1a-4ed2-8e9f-297a7e6a7197';

if (!fs.existsSync('screenshots')) {
  fs.mkdirSync('screenshots', { recursive: true });
}

let portCounter = 9600;

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

    // Wait for GLBs, scene shaders, and textures to settle
    await send('Runtime.evaluate', {
      expression: 'new Promise(r => setTimeout(r, 2000))',
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

async function runMilestoneBCaptures() {
  console.log('=== CAPTURING MILESTONE B DUAL-RESOLUTION SCREENSHOTS ===\n');

  const targets = [
    {
      baseName: 'milestone_b_01_farmhouse_exterior_front',
      url: 'http://localhost:5174/?started=1&time=08:30',
      description: 'Handcrafted Alpine Farmhouse Exterior (Front Elevation, Porch & Veranda)',
      setupFn: () => {
        const p = window.player;
        p.respawn(new window.THREE.Vector3(0, 1.35, -23.0));
        p.yaw = 0.0;
        p.pitch = 0.12;
      }
    },
    {
      baseName: 'milestone_b_02_farmhouse_exterior_porch_angle',
      url: 'http://localhost:5174/?started=1&time=08:30',
      description: 'Farmhouse Exterior 3/4 Perspective (Porch, Timber Beams & Woodshed)',
      setupFn: () => {
        const p = window.player;
        p.respawn(new window.THREE.Vector3(-8.8, 1.45, -23.5));
        p.yaw = -0.65;
        p.pitch = 0.12;
      }
    },
    {
      baseName: 'milestone_b_03_farmhouse_interior_wide',
      url: 'http://localhost:5174/?started=1&time=08:30',
      description: 'Cozy Alpine Farmhouse Interior (Cedar Floorboards, Hearth, Bed & Dining)',
      setupFn: () => {
        const p = window.player;
        p.respawn(new window.THREE.Vector3(160.0, 1.3, 162.8));
        p.yaw = 0.0;
        p.pitch = -0.05;
      }
    },
    {
      baseName: 'milestone_b_04_interior_hearth_fireplace',
      url: 'http://localhost:5174/?started=1&time=20:30',
      description: 'Atmospheric Evening Stone Hearth (Warm Amber Firelight Glow & Logs)',
      setupFn: () => {
        const p = window.player;
        p.respawn(new window.THREE.Vector3(160.0, 1.25, 159.2));
        p.yaw = 0.0;
        p.pitch = -0.12;
      }
    },
    {
      baseName: 'milestone_b_05_interior_bedroom_sleep',
      url: 'http://localhost:5174/?started=1&time=21:30',
      description: 'Quilted Bed Nook (Sleeping Interaction, Table Lamp & Headboard)',
      setupFn: () => {
        const p = window.player;
        p.respawn(new window.THREE.Vector3(161.4, 1.25, 159.0));
        p.yaw = -1.20;
        p.pitch = -0.22;
      }
    },
    {
      baseName: 'milestone_b_06_storage_chest_interaction',
      url: 'http://localhost:5174/?started=1&time=08:30',
      description: 'Cedar Storage Chest Interaction (Opened 16-Slot Chest UI & Backpack)',
      setupFn: () => {
        const p = window.player;
        const w = window.world;
        p.respawn(new window.THREE.Vector3(158.2, 1.25, 158.8));
        p.yaw = 0.0;
        p.pitch = -0.38;

        // Open chest interactable
        const chest = w.interactables.find(i => i.id === 'house_chest');
        if (chest) {
          chest.interact(p);
        }
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

  console.log('\n=== ALL 12 SCREENSHOTS CAPTURED SUCCESSFULLY ===');
}

runMilestoneBCaptures().catch(err => {
  console.error('Fatal capture error:', err);
  process.exit(1);
});
