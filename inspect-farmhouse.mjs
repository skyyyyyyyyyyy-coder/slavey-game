import { spawn } from 'child_process';

const chromePath = 'C:\\Users\\chlov\\AppData\\Local\\ms-playwright\\chromium-1234\\chrome-win64\\chrome.exe';
const testPort = 9269;
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
    const report = { colliders: [], objects: [] };
    window.world.world.colliders.forEach(c => {
      if (c.mesh && c.mesh.name && c.mesh.name.includes('col')) {
        report.colliders.push({
          name: c.mesh.name,
          min: { x: c.box.min.x.toFixed(2), y: c.box.min.y.toFixed(2), z: c.box.min.z.toFixed(2) },
          max: { x: c.box.max.x.toFixed(2), y: c.box.max.y.toFixed(2), z: c.box.max.z.toFixed(2) }
        });
      }
    });
    const ext = window.world.farmhouseExteriorModel;
    if (ext) {
      ext.traverse(o => {
        if (o.isMesh && (o.name.includes('Porch') || o.name.includes('Step') || o.name.includes('Door') || o.name.includes('Foundation'))) {
          const wp = new window.THREE.Vector3();
          o.getWorldPosition(wp);
          const bb = new window.THREE.Box3().setFromObject(o);
          report.objects.push({
            name: o.name,
            pos: { x: wp.x.toFixed(2), y: wp.y.toFixed(2), z: wp.z.toFixed(2) },
            boundsMin: { x: bb.min.x.toFixed(2), y: bb.min.y.toFixed(2), z: bb.min.z.toFixed(2) },
            boundsMax: { x: bb.max.x.toFixed(2), y: bb.max.y.toFixed(2), z: bb.max.z.toFixed(2) }
          });
        }
      });
    }
    return report;
  })()`,
  returnByValue: true
});

console.log(JSON.stringify(evalResult.result.value, null, 2));
chrome.kill();
