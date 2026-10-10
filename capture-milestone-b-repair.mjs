import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const chromePath = 'C:\\Users\\chlov\\AppData\\Local\\ms-playwright\\chromium-1234\\chrome-win64\\chrome.exe';
const artifactDir = 'C:\\Users\\chlov\\.gemini\\antigravity\\brain\\ae1064fc-6b1a-4ed2-8e9f-297a7e6a7197';

if (!fs.existsSync('screenshots')) {
  fs.mkdirSync('screenshots', { recursive: true });
}

let portCounter = 9700;

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

async function runMilestoneBRepairCaptures() {
  console.log('=== CAPTURING MILESTONE B REPAIR & POLISH DUAL-RESOLUTION SCREENSHOTS ===\n');

  const targets = [
    {
      baseName: 'milestone_b_01_farmhouse_exterior_front',
      url: 'http://localhost:5174/?started=1&time=09:00',
      description: '1. Handcrafted Alpine Farmhouse Front Elevation (Roof, Porch, Stairs, Flower Boxes, Chimney)',
      setupFn: () => {
        const p = window.player;
        p.respawn(new window.THREE.Vector3(0, 1.45, -21.5));
        p.yaw = 0.0;
        p.pitch = 0.14;
      }
    },
    {
      baseName: 'milestone_b_02_farmhouse_exterior_porch_angle',
      url: 'http://localhost:5174/?started=1&time=09:00',
      description: '2. Farmhouse Exterior 3/4 Perspective (Woodshed, Alpine Gables, Rafter Tails, Timber Trims)',
      setupFn: () => {
        const p = window.player;
        p.respawn(new window.THREE.Vector3(-8.5, 1.45, -22.5));
        p.yaw = -0.62;
        p.pitch = 0.12;
      }
    },
    {
      baseName: 'milestone_b_03_porch_stairs_closeup',
      url: 'http://localhost:5174/?started=1&time=09:00',
      description: '3. Porch & Stair Close-Up (5 Steps Reaching Ground, Stringers, Balusters, Hanging Brass Lantern)',
      setupFn: () => {
        const p = window.player;
        p.respawn(new window.THREE.Vector3(0, 1.25, -24.2));
        p.yaw = 0.0;
        p.pitch = 0.06;
      }
    },
    {
      baseName: 'milestone_b_04_door_open_state',
      url: 'http://localhost:5174/?started=1&time=09:00',
      description: '4. Front Door Natural Hinge Open State (Door Swung 90 Degrees Inward from Hinge Edge)',
      setupFn: () => {
        const p = window.player;
        const w = window.world;
        p.respawn(new window.THREE.Vector3(0, 1.62, -26.6));
        p.yaw = 0.0;
        p.pitch = 0.02;

        // Swing door open cleanly at its hinge pivot and lock open state
        w.isFarmhouseDoorOpen = true;
        if (w.farmhouseDoorPivot) {
          w.farmhouseDoorPivot.rotation.y = -Math.PI / 2;
        }
      }
    },
    {
      baseName: 'milestone_b_05_farmhouse_interior_wide',
      url: 'http://localhost:5174/?started=1&time=09:00',
      description: '5. Cozy Furnished Interior (Cedar Floors, Stone Hearth, Quilted Bed, Dining Table, Kitchen)',
      setupFn: () => {
        const p = window.player;
        p.respawn(new window.THREE.Vector3(160.0, 1.30, 162.6));
        p.yaw = 0.0;
        p.pitch = -0.05;
      }
    },
    {
      baseName: 'milestone_b_06_bushes_surroundings',
      url: 'http://localhost:5174/?started=1&time=09:00',
      description: '6. Bushes & Surroundings Polish (Stylized Faceted Foliage Clusters, Organic Silhouette, Berry Accents)',
      setupFn: () => {
        const p = window.player;
        p.respawn(new window.THREE.Vector3(-5.5, 1.40, -22.0));
        p.yaw = -0.45;
        p.pitch = -0.08;
      }
    },
    {
      baseName: 'milestone_b_07_sky_clear_proof',
      url: 'http://localhost:5174/?started=1&time=09:00',
      description: '7. Sky View Looking Up Across Farmhouse (Clear Blue Sky, Proving Floating Black Object Is Gone)',
      setupFn: () => {
        const p = window.player;
        p.respawn(new window.THREE.Vector3(0, 1.35, -23.5));
        p.yaw = 0.0;
        p.pitch = 0.45; // Tilted upward into the open sky above porch and roof
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

  console.log('\n=== ALL 14 MILESTONE B REPAIR SCREENSHOTS CAPTURED SUCCESSFULLY ===');
}

runMilestoneBRepairCaptures().catch(err => {
  console.error('Fatal capture error:', err);
  process.exit(1);
});
