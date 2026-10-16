import { spawn } from 'child_process';

const chromePath = 'C:\\Users\\chlov\\AppData\\Local\\ms-playwright\\chromium-1234\\chrome-win64\\chrome.exe';
const chrome = spawn(chromePath, [
  '--headless=new',
  '--no-sandbox',
  '--window-size=1280,720',
  '--remote-debugging-port=9320',
  'http://localhost:5174/?started=1'
], { stdio: 'ignore' });

async function run() {
  await new Promise(r => setTimeout(r, 2000));
  const tabsRes = await fetch('http://127.0.0.1:9320/json');
  const tabs = await tabsRes.json();
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

  const evalRes = await send('Runtime.evaluate', {
    awaitPromise: true,
    expression: `(async () => {
      const carrotRes = await window.assetPipeline.loadModel('/models/crop_carrot.glb', { collision: 'none' });
      const soilRes = await window.assetPipeline.loadModel('/models/farm_soil_tile.glb', { collision: 'none' });
      
      const carrotChildren = [];
      carrotRes.model.traverse(c => {
        if (c.isMesh) {
          carrotChildren.push({
            name: c.name,
            geometry: c.geometry.type,
            attributes: Object.keys(c.geometry.attributes),
            material: c.material.name || c.material.type,
            vertexColors: !!c.geometry.attributes.color
          });
        }
      });

      const soilChildren = [];
      soilRes.model.traverse(c => {
        if (c.isMesh) {
          soilChildren.push({
            name: c.name,
            geometry: c.geometry.type,
            attributes: Object.keys(c.geometry.attributes),
            material: c.material.name || c.material.type,
            vertexColors: !!c.geometry.attributes.color
          });
        }
      });

      return { carrotChildren, soilChildren };
    })()`,
    returnByValue: true
  });

  console.log('Result:', JSON.stringify(evalRes.result?.value, null, 2));
  chrome.kill();
}

run().catch(e => {
  console.error(e);
  chrome.kill();
});
