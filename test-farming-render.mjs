import { spawn } from 'child_process';

const chromePath = 'C:\\Users\\chlov\\AppData\\Local\\ms-playwright\\chromium-1234\\chrome-win64\\chrome.exe';
const chrome = spawn(chromePath, [
  '--headless=new',
  '--no-sandbox',
  '--window-size=1280,720',
  '--remote-debugging-port=9321',
  'http://localhost:5174/?started=1'
], { stdio: 'ignore' });

async function run() {
  await new Promise(r => setTimeout(r, 2000));
  const tabsRes = await fetch('http://127.0.0.1:9321/json');
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

      // Measure dimensions of each stage and soil
      const stages = {};
      carrotRes.model.traverse(c => {
        if (c.isMesh) {
          const box = new THREE.Box3().setFromObject(c);
          const size = new THREE.Vector3();
          box.getSize(size);
          stages[c.name] = {
            min: { x: +box.min.x.toFixed(3), y: +box.min.y.toFixed(3), z: +box.min.z.toFixed(3) },
            max: { x: +box.max.x.toFixed(3), y: +box.max.y.toFixed(3), z: +box.max.z.toFixed(3) },
            size: { x: +size.x.toFixed(3), y: +size.y.toFixed(3), z: +size.z.toFixed(3) }
          };
        }
      });

      const soilBox = new THREE.Box3().setFromObject(soilRes.model);
      const soilSize = new THREE.Vector3();
      soilBox.getSize(soilSize);
      const soil = {
        min: { x: +soilBox.min.x.toFixed(3), y: +soilBox.min.y.toFixed(3), z: +soilBox.min.z.toFixed(3) },
        max: { x: +soilBox.max.x.toFixed(3), y: +soilBox.max.y.toFixed(3), z: +soilBox.max.z.toFixed(3) },
        size: { x: +soilSize.x.toFixed(3), y: +soilSize.y.toFixed(3), z: +soilSize.z.toFixed(3) }
      };

      return { stages, soil };
    })()`,
    returnByValue: true
  });

  console.log('Bounding boxes:', JSON.stringify(evalRes.result?.value, null, 2));
  chrome.kill();
}

run().catch(e => {
  console.error(e);
  chrome.kill();
});
