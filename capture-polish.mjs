import { spawn } from 'child_process';
import fs from 'fs';

const chromePath = 'C:\\Users\\chlov\\AppData\\Local\\ms-playwright\\chromium-1234\\chrome-win64\\chrome.exe';
const port = 9228;

async function capture(url, outFile, setupFn) {
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--no-sandbox',
    '--window-size=1920,1080',
    '--remote-debugging-port=' + port,
    url
  ], { stdio: 'ignore' });

  await new Promise(r => setTimeout(r, 2200));

  try {
    const res = await fetch('http://127.0.0.1:' + port + '/json');
    const tabs = await res.json();
    const pageTab = tabs.find(t => t.type === 'page');
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

    if (setupFn) {
      await send('Runtime.evaluate', { expression: setupFn });
      await new Promise(r => setTimeout(r, 600));
    }

    const shot = await send('Page.captureScreenshot');
    fs.writeFileSync('screenshots/' + outFile, Buffer.from(shot.data, 'base64'));
    console.log('Saved: screenshots/' + outFile);
    chrome.kill();
  } catch (err) {
    console.error('Failed to capture ' + outFile, err);
    chrome.kill();
  }
}

async function run() {
  // 1. Spawn View (1920x1080)
  await capture('http://localhost:5174/?started=1&time=12:00', 'trees_polish_spawn_1920x1080.png');

  // 2. Look Down View (testing FP camera looking at ground)
  await capture('http://localhost:5174/?started=1&time=12:00', 'trees_polish_lookdown_1920x1080.png', `
    window.player.pitch = -1.25;
    window.player.update(0.016, window.world.interactables);
  `);

  // 3. Orchard View
  await capture('http://localhost:5174/?started=1&time=12:00', 'trees_polish_orchard_1920x1080.png', `
    window.player.position.set(15, 1.2, -4);
    window.player.yaw = -0.85;
    window.player.pitch = -0.05;
    window.player.update(0.016, window.world.interactables);
  `);

  // 4. Garden View
  await capture('http://localhost:5174/?started=1&time=12:00', 'trees_polish_garden_1920x1080.png', `
    window.player.position.set(-10, 1.2, -4);
    window.player.yaw = 2.4;
    window.player.pitch = -0.05;
    window.player.update(0.016, window.world.interactables);
  `);
}

run();
