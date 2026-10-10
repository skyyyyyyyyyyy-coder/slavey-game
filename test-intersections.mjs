import { spawn } from 'child_process';

const chromePath = 'C:\\Users\\chlov\\AppData\\Local\\ms-playwright\\chromium-1234\\chrome-win64\\chrome.exe';
const testPort = 9271;
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
    if (!ext) return { error: 'No farmhouse exterior' };
    const houseBox = new window.THREE.Box3().setFromObject(ext);
    const intersections = [];
    const nearby = [];
    
    window.world.scene.traverse(o => {
      if (o.isMesh && o.visible && !ext.getObjectById(o.id)) {
        const b = new window.THREE.Box3().setFromObject(o);
        const mountainColors = ['475569', '64748b', '2d5a3f', '1e3a29'];
        const color = o.material?.color ? o.material.color.getHexString() : 'none';
        if (mountainColors.includes(color) && houseBox.intersectsBox(b)) {
          intersections.push({
            color,
            geo: o.geometry?.type,
            pos: { x: o.position.x.toFixed(2), y: o.position.y.toFixed(2), z: o.position.z.toFixed(2) },
            worldPos: (() => { const wp = new window.THREE.Vector3(); o.getWorldPosition(wp); return { x: wp.x.toFixed(2), y: wp.y.toFixed(2), z: wp.z.toFixed(2) }; })(),
            min: { x: b.min.x.toFixed(2), y: b.min.y.toFixed(2), z: b.min.z.toFixed(2) },
            max: { x: b.max.x.toFixed(2), y: b.max.y.toFixed(2), z: b.max.z.toFixed(2) }
          });
        }
      }
    });
    return {
      houseBox: {
        min: { x: houseBox.min.x.toFixed(2), y: houseBox.min.y.toFixed(2), z: houseBox.min.z.toFixed(2) },
        max: { x: houseBox.max.x.toFixed(2), y: houseBox.max.y.toFixed(2), z: houseBox.max.z.toFixed(2) }
      },
      intersections
    };
  })()`,
  returnByValue: true
});
console.log(JSON.stringify(evalResult.result.value, null, 2));
chrome.kill();
