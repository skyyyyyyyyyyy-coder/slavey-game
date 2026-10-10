import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const chromePath = 'C:\\Users\\chlov\\AppData\\Local\\ms-playwright\\chromium-1234\\chrome-win64\\chrome.exe';
const artifactDir = 'C:\\Users\\chlov\\.gemini\\antigravity\\brain\\ae1064fc-6b1a-4ed2-8e9f-297a7e6a7197';

if (!fs.existsSync('screenshots')) {
  fs.mkdirSync('screenshots', { recursive: true });
}

let portCounter = 9280;

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
      expression: `new Promise(r => setTimeout(r, 1200))`,
      awaitPromise: true
    });

    let evalResult = null;
    if (setupFn) {
      evalResult = await send('Runtime.evaluate', { expression: setupFn, awaitPromise: true });
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
  console.log('=== STARTING BLENDER APPLE TREE POC VALIDATION & CAPTURES ===\n');

  // Test 1: Full tree from gameplay distance
  console.log('--- 1. Full Tree from Gameplay Distance ---');
  await captureShot(
    'http://localhost:5174/?started=1&cam=blender-tree&time=12:00',
    'blender_tree_01_full_gameplay_distance',
    1920, 1080
  );
  await captureShot(
    'http://localhost:5174/?started=1&cam=blender-tree&time=12:00',
    'blender_tree_01_full_gameplay_distance',
    1440, 900
  );

  // Test 2: Close-up of trunk, flared root base, and spreading scaffold branches
  console.log('--- 2. Close-up of Trunk and Scaffold Branches ---');
  await captureShot(
    'http://localhost:5174/?started=1&cam=blender-trunk&time=12:00',
    'blender_tree_02_closeup_trunk_branches',
    1920, 1080
  );
  await captureShot(
    'http://localhost:5174/?started=1&cam=blender-trunk&time=12:00',
    'blender_tree_02_closeup_trunk_branches',
    1440, 900
  );

  // Test 3: Close-up of apples and attachment points to branches
  console.log('--- 3. Close-up of Apples and Attachment Stems ---');
  await captureShot(
    'http://localhost:5174/?started=1&cam=blender-apples&time=12:00',
    'blender_tree_03_closeup_apples_attachment',
    1920, 1080
  );
  await captureShot(
    'http://localhost:5174/?started=1&cam=blender-apples&time=12:00',
    'blender_tree_03_closeup_apples_attachment',
    1440, 900
  );

  // Test 4: Old vs New Side-by-Side Comparison in actual orchard
  console.log('--- 4. Old vs New Side-by-Side Comparison ---');
  await captureShot(
    'http://localhost:5174/?started=1&cam=blender-compare&time=12:00',
    'blender_tree_04_side_by_side_comparison',
    1920, 1080
  );
  await captureShot(
    'http://localhost:5174/?started=1&cam=blender-compare&time=12:00',
    'blender_tree_04_side_by_side_comparison',
    1440, 900
  );

  // Test 5: Sunset Lighting Appearance (18:30) with warm golden atmosphere
  console.log('--- 5. Sunset (18:30) Golden Atmosphere ---');
  await captureShot(
    'http://localhost:5174/?started=1&cam=blender-tree&time=18:30',
    'blender_tree_05_sunset_1830',
    1920, 1080
  );
  await captureShot(
    'http://localhost:5174/?started=1&cam=blender-tree&time=18:30',
    'blender_tree_05_sunset_1830',
    1440, 900
  );

  // Interactive Harvesting & Physics Verification
  console.log('\n--- 6. Interactive Harvesting & Profiler Measurements ---');
  const metricsResult = await captureShot(
    'http://localhost:5174/?started=1&cam=blender-tree&time=12:00',
    'blender_tree_06_harvested_state',
    1920, 1080,
    `(() => {
      const bFruit = window.world.interactables.find(it => it.id === 'apple_tree_3_fruit_0');
      
      const prevApples = window.player.inventory.find(i => i.id === 'apple')?.count || 0;
      let harvestTriggered = false;
      if (bFruit && bFruit.ready) {
        bFruit.interact(window.player);
        harvestTriggered = true;
      }
      const postApples = window.player.inventory.find(i => i.id === 'apple')?.count || 0;

      const rendererInfo = {
        calls: window.renderer.info.render.calls,
        triangles: window.renderer.info.render.triangles,
        points: window.renderer.info.render.points,
        lines: window.renderer.info.render.lines,
        geometries: window.renderer.info.memory.geometries,
        textures: window.renderer.info.memory.textures
      };

      return {
        hasBlenderFruit: !!bFruit,
        harvestTriggered,
        prevApples,
        postApples,
        appleShrunk: bFruit ? (bFruit.mesh ? bFruit.mesh.scale.x < 0.1 : false) : false,
        rendererInfo
      };
    })()`
  );

  console.log('Harvest & Diagnostics Telemetry:', JSON.stringify(metricsResult?.result?.value, null, 2));
  console.log('\n=== BLENDER TREE POC CAPTURES COMPLETE ===');
}

run();
