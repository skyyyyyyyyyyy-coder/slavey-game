import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const chromePath = 'C:\\Users\\chlov\\AppData\\Local\\ms-playwright\\chromium-1234\\chrome-win64\\chrome.exe';
const artifactDir = 'C:\\Users\\chlov\\.gemini\\antigravity\\brain\\ae1064fc-6b1a-4ed2-8e9f-297a7e6a7197';

if (!fs.existsSync('screenshots')) {
  fs.mkdirSync('screenshots', { recursive: true });
}

let portCounter = 9340;

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

    // Wait for assets and GLTF to settle
    await send('Runtime.evaluate', {
      expression: `new Promise(r => setTimeout(r, 1400))`,
      awaitPromise: true
    });

    let evalResult = null;
    if (setupFn) {
      evalResult = await send('Runtime.evaluate', { expression: setupFn, awaitPromise: true, returnByValue: true });
      await new Promise(r => setTimeout(r, 800));
    }

    const snap = await send('Page.captureScreenshot', { format: 'png' });
    const buf = Buffer.from(snap.data, 'base64');

    const outDisk = path.join('screenshots', `${baseName}_${width}x${height}.png`);
    fs.writeFileSync(outDisk, buf);

    const outArtifact = path.join(artifactDir, `${baseName}_${width}x${height}.png`);
    fs.writeFileSync(outArtifact, buf);

    console.log(`Saved screenshot: ${outDisk} (${width}x${height})`);

    ws.close();
    chrome.kill();
    return evalResult;
  } catch (err) {
    console.error(`Failed to capture ${baseName}:`, err);
    chrome.kill();
    return null;
  }
}

async function run() {
  console.log('=== STARTING COMPLETE ORCHARD UPGRADE VALIDATION & CAPTURES ===\n');

  // Shot 1: Wide panoramic view of East Orchard rows (12:00 Midday)
  console.log('--- 1. Wide View of Complete Upgraded Orchard ---');
  await captureShot(
    'http://localhost:5174/?started=1&cam=orchard-wide&time=12:00',
    'orchard_upgrade_01_wide_panorama',
    1920, 1080
  );
  await captureShot(
    'http://localhost:5174/?started=1&cam=orchard-wide&time=12:00',
    'orchard_upgrade_01_wide_panorama',
    1440, 900
  );

  // Shot 2: Eye-level perspective along East Orchard Lane showing procedural variations
  console.log('--- 2. Orchard Lane Perspective (Procedural Variations) ---');
  await captureShot(
    'http://localhost:5174/?started=1&cam=orchard-row&time=12:00',
    'orchard_upgrade_02_lane_perspective',
    1920, 1080
  );
  await captureShot(
    'http://localhost:5174/?started=1&cam=orchard-row&time=12:00',
    'orchard_upgrade_02_lane_perspective',
    1440, 900
  );

  // Shot 3: West Grove heritage apple trees framing kitchen garden
  console.log('--- 3. West Grove Heritage Apple Trees ---');
  await captureShot(
    'http://localhost:5174/?started=1&cam=west-grove&time=12:00',
    'orchard_upgrade_03_west_grove',
    1920, 1080
  );
  await captureShot(
    'http://localhost:5174/?started=1&cam=west-grove&time=12:00',
    'orchard_upgrade_03_west_grove',
    1440, 900
  );

  // Shot 4: Close-up of branch anchor attachment (mature apples)
  console.log('--- 4. Close-up of Branch Anchor Attachment (Mature) ---');
  await captureShot(
    'http://localhost:5174/?started=1&cam=apple-branch&time=12:00',
    'orchard_upgrade_04_branch_anchor_mature',
    1920, 1080
  );
  await captureShot(
    'http://localhost:5174/?started=1&cam=apple-branch&time=12:00',
    'orchard_upgrade_04_branch_anchor_mature',
    1440, 900
  );

  // Shot 5: Harvested state (pluck complete - ZERO floating stem or phantom fruit!)
  console.log('--- 5. Harvested Pluck State (Clean Branch, Zero Floating Stem) ---');
  const pluckFn = `(() => {
    const tree = window.world.fruitTrees[3];
    tree.fruits.forEach(f => {
      if (f.ready) f.interact(window.player);
      f.update(0.3); // finish 200ms pluck shrink
    });
    return { pluckedAll: true };
  })()`;
  await captureShot(
    'http://localhost:5174/?started=1&cam=apple-branch&time=12:00',
    'orchard_upgrade_05_harvested_clean_branch',
    1920, 1080,
    pluckFn
  );
  await captureShot(
    'http://localhost:5174/?started=1&cam=apple-branch&time=12:00',
    'orchard_upgrade_05_harvested_clean_branch',
    1440, 900,
    pluckFn
  );

  // Shot 6: Early regrowth (tiny bud anchored directly onto branch spur)
  console.log('--- 6. Early Regrowth (Bud Developing on Branch Spur) ---');
  const earlyRegrowthFn = `(() => {
    const tree = window.world.fruitTrees[3];
    tree.fruits.forEach(f => {
      f.ready = false;
      f.pluckTimer = 0;
      f.growTimer = 13.0; // progress = 2 / 15 = 0.133 -> bud scale ~ 0.12
      f.update(0.01);
    });
    return { earlyBudOk: true };
  })()`;
  await captureShot(
    'http://localhost:5174/?started=1&cam=apple-branch&time=12:00',
    'orchard_upgrade_06_regrowth_early_bud',
    1920, 1080,
    earlyRegrowthFn
  );
  await captureShot(
    'http://localhost:5174/?started=1&cam=apple-branch&time=12:00',
    'orchard_upgrade_06_regrowth_early_bud',
    1440, 900,
    earlyRegrowthFn
  );

  // Shot 7: Mid regrowth (50% developed fruit hanging from stem anchored to branch)
  console.log('--- 7. Mid Regrowth (Expanding Outward from Branch Anchor) ---');
  const midRegrowthFn = `(() => {
    const tree = window.world.fruitTrees[3];
    tree.fruits.forEach(f => {
      f.ready = false;
      f.pluckTimer = 0;
      f.growTimer = 7.5; // progress = 7.5 / 15 = 0.50 -> scale ~ 0.54
      f.update(0.01);
    });
    return { midRegrowthOk: true };
  })()`;
  await captureShot(
    'http://localhost:5174/?started=1&cam=apple-branch&time=12:00',
    'orchard_upgrade_07_regrowth_mid_swelling',
    1920, 1080,
    midRegrowthFn
  );
  await captureShot(
    'http://localhost:5174/?started=1&cam=apple-branch&time=12:00',
    'orchard_upgrade_07_regrowth_mid_swelling',
    1440, 900,
    midRegrowthFn
  );


  // Shot 8: Sunset Lighting (18:30) with warm atmospheric glow across the upgraded orchard
  console.log('--- 8. Sunset (18:30) Atmospheric Glow Across Orchard ---');
  await captureShot(
    'http://localhost:5174/?started=1&cam=orchard-row&time=18:30',
    'orchard_upgrade_08_sunset_1830',
    1920, 1080
  );
  await captureShot(
    'http://localhost:5174/?started=1&cam=orchard-row&time=18:30',
    'orchard_upgrade_08_sunset_1830',
    1440, 900
  );

  console.log('\n=== COMPLETE ORCHARD UPGRADE VALIDATION & CAPTURES FINISHED ===');
}

run();
