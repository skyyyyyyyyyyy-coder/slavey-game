import { spawn } from 'child_process';

const chromePath = 'C:\\Users\\chlov\\AppData\\Local\\ms-playwright\\chromium-1234\\chrome-win64\\chrome.exe';
const chrome = spawn(chromePath, ['--headless=new', '--no-sandbox', '--remote-debugging-port=9326', 'http://localhost:5174/?started=1'], { stdio: 'ignore' });

async function inspect() {
  await new Promise(r => setTimeout(r, 2500));
  const tabsRes = await fetch('http://127.0.0.1:9326/json');
  const tabs = await tabsRes.json();
  const pageTab = tabs.find(t => t.url.includes('localhost'));
  const ws = new WebSocket(pageTab.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);

  let id = 1;
  function send(method, params = {}) {
    return new Promise(resolve => {
      const curId = id++;
      const handler = (evt) => {
        const d = JSON.parse(evt.data);
        if (d.id === curId) { ws.removeEventListener('message', handler); resolve(d.result); }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id: curId, method, params }));
    });
  }

  const res = await send('Runtime.evaluate', {
    awaitPromise: true, returnByValue: true,
    expression: `(() => {
      const w = window.world;
      const m = w.farmhouseExteriorModel;
      const b = new THREE.Box3().setFromObject(m);
      const parts = [];
      m.traverse(c => {
        if (c.isMesh) {
          const cb = new THREE.Box3().setFromObject(c);
          parts.push({
            name: c.name,
            minY: +cb.min.y.toFixed(3),
            maxY: +cb.max.y.toFixed(3),
            minZ: +cb.min.z.toFixed(3),
            maxZ: +cb.max.z.toFixed(3),
            minX: +cb.min.x.toFixed(3),
            maxX: +cb.max.x.toFixed(3)
          });
        }
      });
      parts.sort((a,b) => a.minY - b.minY);
      return {
        modelPos: m.position,
        overallBox: { min: b.min, max: b.max },
        lowestParts: parts.slice(0, 15)
      };
    })()`
  });
  console.log(JSON.stringify(res.result?.value, null, 2));
  chrome.kill();
}

inspect().catch(e => { console.error(e); chrome.kill(); });
