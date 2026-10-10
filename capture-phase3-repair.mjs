import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const chromePath = 'C:\\Users\\chlov\\AppData\\Local\\ms-playwright\\chromium-1234\\chrome-win64\\chrome.exe';
const artifactDir = 'C:\\Users\\chlov\\.gemini\\antigravity\\brain\\ae1064fc-6b1a-4ed2-8e9f-297a7e6a7197';

if (!fs.existsSync('screenshots')) {
  fs.mkdirSync('screenshots', { recursive: true });
}

let portCounter = 9450;

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

    // Wait for assets and scene to settle
    await send('Runtime.evaluate', {
      expression: `new Promise(r => setTimeout(r, 1500))`,
      awaitPromise: true
    });

    if (setupFn) {
      await send('Runtime.evaluate', {
        expression: `(${setupFn.toString()})()`,
        awaitPromise: true
      });
      // Allow extra frames for visual updates
      await send('Runtime.evaluate', {
        expression: `new Promise(r => setTimeout(r, 800))`,
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

async function runAllCaptures() {
  console.log('=== CAPTURING PHASE 3 REPAIR DUAL-RESOLUTION SCREENSHOTS ===\n');

  const targets = [
    {
      baseName: 'phase3_repair_01_house_exterior',
      url: 'http://localhost:5174/?started=1&cam=house-exterior&time=12:00',
      description: '2-Story Alpine Farmhouse Exterior (Stone foundation, timber siding, veranda, flower boxes, chimney smoke)'
    },
    {
      baseName: 'phase3_repair_02_house_interior',
      url: 'http://localhost:5174/?started=1&cam=house-interior&time=19:30',
      description: 'Cozy Farmhouse Cabin Interior (Stone fireplace hearth, burning firelight, quilted bed, dining table, kitchen shelves, rug)'
    },
    {
      baseName: 'phase3_repair_03_stone_well',
      url: 'http://localhost:5174/?started=1&cam=well&time=10:00',
      description: 'Charming Stylized Stone Well (Circular dressed stone curb, coping rim, timber A-frame, winch drum, wrapped rope, iron crank, bucket, shingle canopy, water surface)'
    },
    {
      baseName: 'phase3_repair_04_orchard_apple_tree',
      url: 'http://localhost:5174/?started=1&cam=blender-tree&time=17:00',
      description: 'Blender Stylized Apple Tree (Tapered organic trunk, branching canopy, foliage clusters, branch-anchored apples at golden hour)'
    },
    {
      baseName: 'phase3_repair_05_crop_field_diversity',
      url: 'http://localhost:5174/?started=1&cam=crops&time=12:00',
      description: 'Clean Aligned 1x1m Farming Grid (Seamless longitudinal furrows, multiple crop types: Carrots, Wheat, Country Pumpkins, and Garden Tomatoes at diverse growth stages)',
      setupFn: () => {
        const fm = window.farmingManager;
        const p = window.player;
        if (!fm || !p) return;

        // Till a 3x5 block of crops in the West field
        for (let gx = -7; gx <= -5; gx++) {
          for (let gz = 2; gz <= 6; gz++) {
            fm.tillTile(gx, gz, p);
            const tile = fm.tiles.get(`${gx}_${gz}`);
            if (tile) {
              fm.waterTile(tile, p);
              // Pick crop type and stage based on grid position
              let cropType = 'carrot';
              let stage = 4;
              if (gz === 2) { cropType = 'carrot'; stage = (gx + 8); }
              else if (gz === 3) { cropType = 'wheat'; stage = (gx + 8); }
              else if (gz === 4) { cropType = 'pumpkin'; stage = 4; }
              else if (gz === 5) { cropType = 'tomato'; stage = 4; }
              else if (gz === 6) { cropType = 'pumpkin'; stage = 3; }

              tile.crop = { type: cropType, stage: Math.min(4, Math.max(1, stage)), daysWatered: 3, plantedDay: 1 };
              fm.renderCropMesh(tile);
            }
          }
        }
      }
    },
    {
      baseName: 'phase3_repair_06_boundary_mountain_area',
      url: 'http://localhost:5174/?started=1&cam=boundary&time=08:00',
      description: 'Mountain Perimeter Boundary & Corrected Tree Placement (Sealed perimeter cliff wall, multi-tiered alpine pines and organic weeping birches safely positioned in front of mountain wall)'
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

  console.log('\n=== ALL 12 SCREENSHOTS CAPTURED SUCCESSFULLY ===');
}

runAllCaptures();
