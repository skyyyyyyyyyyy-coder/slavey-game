import { spawn } from 'child_process';
import fs from 'fs';

const chromePath = 'C:\\Users\\chlov\\AppData\\Local\\ms-playwright\\chromium-1234\\chrome-win64\\chrome.exe';
const testPort = 9266;

const chrome = spawn(chromePath, [
  '--headless=new',
  '--no-sandbox',
  `--remote-debugging-port=${testPort}`,
  'http://localhost:5174/?started=1'
], { stdio: 'ignore' });

await new Promise(r => setTimeout(r, 2200));

try {
  const res = await fetch(`http://127.0.0.1:${testPort}/json`);
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

  // Allow world to load fully
  await send('Runtime.evaluate', {
    expression: 'new Promise(r => setTimeout(r, 3500))',
    awaitPromise: true
  });

  // Till 4 tiles and plant one of each crop to demonstrate baseline procedural crops
  await send('Runtime.evaluate', {
    expression: `(() => {
      const fm = window.farmingManager;
      const p = window.player;
      // Till 4 tiles at (-7, 2), (-6, 2), (-5, 2), (-4, 2)
      fm.tillTile(-7, 2, p);
      fm.plantCrop(fm.tiles.get('-7_2'), 'carrot', p);
      
      fm.tillTile(-6, 2, p);
      fm.plantCrop(fm.tiles.get('-6_2'), 'wheat', p);
      
      fm.tillTile(-5, 2, p);
      fm.plantCrop(fm.tiles.get('-5_2'), 'pumpkin', p);
      
      fm.tillTile(-4, 2, p);
      fm.plantCrop(fm.tiles.get('-4_2'), 'tomato', p);

      // Force to stage 4 to show baseline ripe visuals
      fm.tiles.get('-7_2').crop.stage = 4; fm.renderCropMesh(fm.tiles.get('-7_2'));
      fm.tiles.get('-6_2').crop.stage = 4; fm.renderCropMesh(fm.tiles.get('-6_2'));
      fm.tiles.get('-5_2').crop.stage = 4; fm.renderCropMesh(fm.tiles.get('-5_2'));
      fm.tiles.get('-4_2').crop.stage = 4; fm.renderCropMesh(fm.tiles.get('-4_2'));
      
      // Water two of them to show wet vs dry
      fm.tiles.get('-7_2').isWatered = true;
      fm.tiles.get('-7_2').soilMesh.material = fm.materials.wateredSoil;
      fm.tiles.get('-5_2').isWatered = true;
      fm.tiles.get('-5_2').soilMesh.material = fm.materials.wateredSoil;

      p.position.set(-5.5, 1.2, 4.2);
      p.yaw = Math.PI; // Face North towards crops
      p.pitch = -0.35;
      p.camera.rotation.set(p.pitch, p.yaw, 0, 'YXZ');
      window.renderer.render(window.scene, window.camera);
    })()`
  });

  await new Promise(r => setTimeout(r, 600));

  // 1920x1080 capture
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1,
    mobile: false
  });
  let screenshot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('screenshots/baseline_c0_crops_lineup_1920x1080.png', Buffer.from(screenshot.data, 'base64'));

  // 1440x900 capture
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false
  });
  screenshot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('screenshots/baseline_c0_crops_lineup_1440x900.png', Buffer.from(screenshot.data, 'base64'));

  console.log('Saved baseline crops lineup dual-resolution screenshots!');

  ws.close();
  chrome.kill();
} catch (err) {
  console.error('Error:', err);
  chrome.kill();
}
