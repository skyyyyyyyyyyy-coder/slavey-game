import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const chromePath = 'C:\\Users\\chlov\\AppData\\Local\\ms-playwright\\chromium-1234\\chrome-win64\\chrome.exe';
const port = 9332;

const chrome = spawn(chromePath, [
  '--headless=new',
  '--no-sandbox',
  '--window-size=1920,1080',
  '--remote-debugging-port=' + port,
  'http://localhost:5174/?started=1'
], { stdio: 'ignore' });

async function run() {
  console.log('=== MEADOW VALLEY STAGE 2 GRAPHICS VERIFICATION & PROOF CAPTURES ===');
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

  // Listen for console errors & exceptions
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

  // Wait for scene and assets
  await send('Runtime.evaluate', {
    awaitPromise: true,
    expression: `(async () => {
      let tries = 0;
      while ((!window.world || !window.farmingManager?.assetsLoaded) && tries < 30) {
        await new Promise(r => setTimeout(r, 100));
        tries++;
      }
    })()`
  });

  // Verify Stage 2 Graphics Architecture in Live Engine
  const verifyRes = await send('Runtime.evaluate', {
    awaitPromise: true,
    returnByValue: true,
    expression: `(() => {
      const w = window.world;
      const dn = window.dayNight;
      const ren = window.renderer;

      // 1. Check grass wind shader uniforms
      const hasGrassWind = !!(w.grassWindUniforms && w.grassWindUniforms.uTime);

      // 2. Check clouds
      const cloudPuffsCount = w.clouds.length;
      const cloudMat = w.cloudMaterial;
      const cloudHasVertexColors = !!cloudMat?.vertexColors;

      // 3. Check shadow settings
      const sunNormalBias = dn?.sunLight?.shadow?.normalBias;
      const moonNormalBias = dn?.moonLight?.shadow?.normalBias;
      const shadowFar = dn?.sunLight?.shadow?.camera?.far;
      const skyCanvasH = dn?.skyCanvas?.height;
      const skyCanvasW = dn?.skyCanvas?.width;

      // 4. Performance telemetry from Three.js renderer.info
      const calls = ren?.info?.render?.calls;
      const triangles = ren?.info?.render?.triangles;
      const geometries = ren?.info?.memory?.geometries;
      const textures = ren?.info?.memory?.textures;

      return {
        hasGrassWind,
        cloudPuffsCount,
        cloudHasVertexColors,
        sunNormalBias,
        moonNormalBias,
        shadowFar,
        skyCanvasW,
        skyCanvasH,
        calls,
        triangles,
        geometries,
        textures
      };
    })()`
  });
  console.log('Stage 2 Graphics Telemetry:', verifyRes.result?.value);

  // Set time helper
  async function setTime(hour) {
    await send('Runtime.evaluate', {
      expression: `(() => {
        window.timeManager.hour = ${Math.floor(hour)};
        window.timeManager.minute = ${Math.floor((hour % 1) * 60)};
        window.timeManager.second = 0;
        window.dayNight.update();
      })()`
    });
    await new Promise(r => setTimeout(r, 600));
  }

  // Set camera helper
  async function setCamera(pos, yaw, pitch) {
    await send('Runtime.evaluate', {
      expression: `(() => {
        window.player.respawn(new THREE.Vector3(${pos.x}, ${pos.y}, ${pos.z}));
        window.player.yaw = ${yaw};
        window.player.pitch = ${pitch};
      })()`
    });
    await new Promise(r => setTimeout(r, 500));
  }

  // CAPTURE 1: Midday 12:00 Panoramic Valley (Farmhouse, meadow grass, layered mountains, cumulus clouds)
  await setTime(12.0);
  await setCamera({ x: 0.0, y: 7.5, z: 28.0 }, Math.PI, -0.18);
  await capture('stage2_01_midday_panoramic_valley.png');

  // CAPTURE 2: Golden Hour 17:00 (Warm low-angle light over orchard and meadow)
  await setTime(17.0);
  await setCamera({ x: 12.0, y: 3.2, z: 12.0 }, -1.0, -0.12);
  await capture('stage2_02_goldenhour_orchard_meadow.png');

  // CAPTURE 3: Sunset 18:30 (Rich apricot/salmon/violet layered sky, glowing windows, western massifs)
  await setTime(18.5);
  await setCamera({ x: 18.0, y: 3.5, z: -10.0 }, 1.35, -0.05);
  await capture('stage2_03_sunset_mountain_ridge.png');

  // CAPTURE 4: Night 22:30 (Starry sky, moonlit sculpted clouds, cozy lantern and glowing hearth)
  await setTime(22.5);
  await setCamera({ x: 0.0, y: 3.2, z: -16.0 }, Math.PI, 0.15);
  await capture('stage2_04_night_starfield_clouds.png');

  // CAPTURE 5: Morning 08:00 North Alpine Massifs (Crisp arêtes, couloir snow drifts, rolling moraine foothills)
  await setTime(8.0);
  await setCamera({ x: -14.0, y: 4.5, z: 2.0 }, Math.PI - 0.2, 0.08);
  await capture('stage2_05_north_alpine_horizon.png');

  // CAPTURE 6: Meadow Ground Close-up (3D tapered grass blades, Alpine Poppies, Buttercups, Lavender, River Pebbles)
  await setTime(12.0);
  await setCamera({ x: -12.0, y: 1.2, z: 2.0 }, 0.8, -0.65);
  await capture('stage2_06_close_grass_wildflowers.png');

  // Measure FPS over 60 rendered frames
  const fpsRes = await send('Runtime.evaluate', {
    awaitPromise: true,
    returnByValue: true,
    expression: `(async () => {
      let frames = 0;
      const start = performance.now();
      while (frames < 60) {
        await new Promise(r => requestAnimationFrame(r));
        frames++;
      }
      const elapsed = performance.now() - start;
      const fps = (frames / (elapsed / 1000));
      return { fps: Math.round(fps), elapsedMs: Math.round(elapsed) };
    })()`
  });
  console.log('Performance Benchmark (FPS):', fpsRes.result?.value);

  // Check for console errors
  console.log('Console Errors caught:', consoleErrors.length ? consoleErrors : 'None (0 errors!)');

  ws.close();
  chrome.kill();
  console.log('=== STAGE 2 VERIFICATION & PROOF COMPLETE ===');
}

run().catch(err => {
  console.error('ERROR in Stage 2 proof capture:', err);
  chrome.kill();
  process.exit(1);
});
