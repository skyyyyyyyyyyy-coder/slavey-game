import { spawn } from 'child_process';

const chromePath = 'C:\\Users\\chlov\\AppData\\Local\\ms-playwright\\chromium-1234\\chrome-win64\\chrome.exe';
const testPort = 9273;
const chrome = spawn(chromePath, ['--headless=new', '--no-sandbox', '--remote-debugging-port=' + testPort, 'http://localhost:5174/?started=1'], { stdio: 'ignore' });
await new Promise(r => setTimeout(r, 2200));
const res = await fetch('http://127.0.0.1:' + testPort + '/json');
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
await send('Runtime.evaluate', { expression: 'new Promise(r => setTimeout(r, 2000))', awaitPromise: true });
const evalResult = await send('Runtime.evaluate', {
  expression: `(() => {
    const ext = window.world.farmhouseExteriorModel;
    const detached = [];
    ext.traverse(c => {
      if (c.isMesh) {
        const wp = new window.THREE.Vector3();
        c.getWorldPosition(wp);
        // Farmhouse envelope: X in [-8, 8], Y in [0, 9], Z in [-40, -25]
        if (wp.z > -25 || Math.abs(wp.x) > 8.5 || wp.y > 9.5) {
          detached.push({
            name: c.name,
            pos: { x: wp.x.toFixed(2), y: wp.y.toFixed(2), z: wp.z.toFixed(2) }
          });
        }
      }
    });
    return detached;
  })()`,
  returnByValue: true
});

console.log('Detached farmhouse objects outside building envelope:');
console.log(JSON.stringify(evalResult.result.value, null, 2));
chrome.kill();
