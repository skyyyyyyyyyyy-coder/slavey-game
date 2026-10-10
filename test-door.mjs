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
    if (!ext) return { error: 'No exterior model' };
    const pivot = ext.getObjectByName('door_pivot');
    const leaf = ext.getObjectByName('door_leaf');
    const hingeTop = ext.getObjectByName('Door_Hinge_Top');
    const handle = ext.getObjectByName('Door_Handle');
    return {
      pivotFound: !!pivot,
      pivotPos: pivot ? { x: pivot.position.x, y: pivot.position.y, z: pivot.position.z } : null,
      leafFound: !!leaf,
      leafPos: leaf ? { x: leaf.position.x, y: leaf.position.y, z: leaf.position.z } : null,
      leafParent: leaf && leaf.parent ? leaf.parent.name : null,
      hingeParent: hingeTop && hingeTop.parent ? hingeTop.parent.name : null,
      handleParent: handle && handle.parent ? handle.parent.name : null
    };
  })()`,
  returnByValue: true
});

console.log(JSON.stringify(evalResult.result.value, null, 2));
chrome.kill();
