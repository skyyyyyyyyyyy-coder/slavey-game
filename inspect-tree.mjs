import { spawn } from 'child_process';

const chrome = spawn('C:\\Users\\chlov\\AppData\\Local\\ms-playwright\\chromium-1234\\chrome-win64\\chrome.exe', [
  '--headless=new', '--no-sandbox', '--window-size=1280,720', '--remote-debugging-port=9322',
  'http://localhost:5174/?started=1&cam=apple-branch'
], { stdio: 'ignore' });

setTimeout(async () => {
  try {
    const res = await fetch('http://127.0.0.1:9322/json');
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

    const r = await send('Runtime.evaluate', {
      expression: `(() => {
        const f2 = window.world.interactables.find(i => i.id === 'apple_tree_3_fruit_2');
        if (f2 && f2.ready) f2.interact(window.player);
        f2.update(0.3); // finish pluck shrink
        return JSON.stringify({
          f2Visible: f2.mesh?.visible,
          f2Scale: f2.mesh?.scale.x
        });
      })()`
    });

    console.log('F2 TEST:', r.result?.value);
    ws.close();
    chrome.kill();
  } catch (err) {
    console.error(err);
    chrome.kill();
  }
}, 2200);
