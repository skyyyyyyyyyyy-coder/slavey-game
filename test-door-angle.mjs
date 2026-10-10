import { spawn } from 'child_process';

const chromePath = 'C:\\Users\\chlov\\AppData\\Local\\ms-playwright\\chromium-1234\\chrome-win64\\chrome.exe';
const testPort = 9275;
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
    const w = window.world;
    const pivot = w.farmhouseDoorPivot;
    const leaf = w.farmhouseDoorLeaf;
    
    // Check closed pos
    pivot.rotation.y = 0;
    leaf.updateMatrixWorld(true);
    const p0 = new window.THREE.Vector3();
    leaf.getWorldPosition(p0);

    // Try -PI/2
    pivot.rotation.y = -Math.PI / 2;
    leaf.updateMatrixWorld(true);
    const pMinus = new window.THREE.Vector3();
    leaf.getWorldPosition(pMinus);

    // Try +PI/2
    pivot.rotation.y = Math.PI / 2;
    leaf.updateMatrixWorld(true);
    const pPlus = new window.THREE.Vector3();
    leaf.getWorldPosition(pPlus);

    return {
      closed: { x: p0.x.toFixed(2), y: p0.y.toFixed(2), z: p0.z.toFixed(2) },
      minusHalfPi: { x: pMinus.x.toFixed(2), y: pMinus.y.toFixed(2), z: pMinus.z.toFixed(2) },
      plusHalfPi: { x: pPlus.x.toFixed(2), y: pPlus.y.toFixed(2), z: pPlus.z.toFixed(2) }
    };
  })()`,
  returnByValue: true
});

console.log(JSON.stringify(evalResult.result.value, null, 2));
chrome.kill();
