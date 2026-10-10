import { spawn } from 'child_process';

const chromePath = 'C:\\Users\\chlov\\AppData\\Local\\ms-playwright\\chromium-1234\\chrome-win64\\chrome.exe';
const testPort = 9268;
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
    const s = window.world.scene;
    const items = [];
    s.traverse(c => {
      if (c.isMesh) {
        const wp = new window.THREE.Vector3();
        c.getWorldPosition(wp);
        const matColor = c.material && c.material.color ? '#' + c.material.color.getHexString() : 'none';
        // Check for black / very dark objects or objects with high Y or strange names
        if (matColor === '#000000' || matColor === '#121214' || matColor === '#1f1f23' || c.name.toLowerCase().includes('black') || (wp.y > 4 && wp.y < 35)) {
          items.push({
            name: c.name,
            parent: c.parent ? c.parent.name : null,
            pos: { x: wp.x.toFixed(2), y: wp.y.toFixed(2), z: wp.z.toFixed(2) },
            color: matColor,
            visible: c.visible,
            castShadow: c.castShadow
          });
        }
      }
    });
    return items;
  })()`,
  returnByValue: true
});

console.log(JSON.stringify(evalResult.result.value, null, 2));
chrome.kill();
