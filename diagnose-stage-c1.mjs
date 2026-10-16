import { spawn } from 'child_process';

const chromePath = 'C:\\Users\\chlov\\AppData\\Local\\ms-playwright\\chromium-1234\\chrome-win64\\chrome.exe';
const chrome = spawn(chromePath, [
  '--headless=new',
  '--no-sandbox',
  '--window-size=1920,1080',
  '--remote-debugging-port=9324',
  'http://localhost:5174/?started=1'
], { stdio: 'ignore' });

async function run() {
  console.log('=== DIAGNOSING ENVIRONMENT, FARMHOUSE & VEGETATION ===');
  await new Promise(r => setTimeout(r, 2500));

  const tabsRes = await fetch('http://127.0.0.1:9324/json');
  const tabs = await tabsRes.json();
  const pageTab = tabs.find(t => t.type === 'page' || t.url.includes('localhost'));
  if (!pageTab) throw new Error('Could not find active game page tab');

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

  // 1. Inspect Farmhouse Exterior & Terrace geometry
  const houseData = await send('Runtime.evaluate', {
    awaitPromise: true,
    returnByValue: true,
    expression: `(async () => {
      const w = window.world;
      // Wait for farmhouse model if still loading
      let attempts = 0;
      while (!w?.farmhouseExteriorModel && attempts < 30) {
        await new Promise(r => setTimeout(r, 100));
        attempts++;
      }
      const model = w?.farmhouseExteriorModel;
      if (!model) return { error: 'No farmhouse model found after wait' };

      const worldBox = new THREE.Box3().setFromObject(model);
      const childData = [];
      model.traverse(c => {
        if (c.isMesh) {
          const b = new THREE.Box3().setFromObject(c);
          childData.push({
            name: c.name,
            minY: +b.min.y.toFixed(3),
            maxY: +b.max.y.toFixed(3),
            minZ: +b.min.z.toFixed(3),
            maxZ: +b.max.z.toFixed(3),
            minX: +b.min.x.toFixed(3),
            maxX: +b.max.x.toFixed(3),
          });
        }
      });

      return {
        modelPos: { x: model.position.x, y: model.position.y, z: model.position.z },
        modelWorldBox: {
          min: { x: +worldBox.min.x.toFixed(3), y: +worldBox.min.y.toFixed(3), z: +worldBox.min.z.toFixed(3) },
          max: { x: +worldBox.max.x.toFixed(3), y: +worldBox.max.y.toFixed(3), z: +worldBox.max.z.toFixed(3) }
        },
        childCount: childData.length,
        children: childData
      };
    })()`
  });
  console.log('--- FARMHOUSE EXTERIOR BOUNDS ---');
  console.log(JSON.stringify(houseData.result?.value, null, 2));

  // 2. Inspect Vegetation & Bushes
  const vegData = await send('Runtime.evaluate', {
    awaitPromise: true,
    returnByValue: true,
    expression: `(() => {
      const s = window.world?.scene;
      let dodecahedrons = 0;
      let cones = 0;
      let cylinders = 0;
      let boxes = 0;
      let bushMeshes = [];

      s.traverse(obj => {
        if (obj.isMesh) {
          const gName = obj.geometry?.type || '';
          if (gName.includes('Dodecahedron')) {
            dodecahedrons++;
            const col = obj.material?.color?.getHex() || 0;
            bushMeshes.push({
              name: obj.name,
              color: '0x' + col.toString(16),
              y: +obj.position.y.toFixed(2),
              worldY: +(new THREE.Vector3().setFromMatrixPosition(obj.matrixWorld).y).toFixed(2)
            });
          }
          if (gName.includes('Cone')) cones++;
          if (gName.includes('Cylinder')) cylinders++;
          if (gName.includes('Box')) boxes++;
        }
      });

      return {
        dodecahedrons,
        cones,
        cylinders,
        boxes,
        sampleBushes: bushMeshes.slice(0, 8),
        totalBushes: bushMeshes.length
      };
    })()`
  });
  console.log('--- VEGETATION GEOMETRY STATS ---');
  console.log(JSON.stringify(vegData.result?.value, null, 2));

  // 3. Inspect Static Paddocks vs Farming Grid
  const paddockData = await send('Runtime.evaluate', {
    awaitPromise: true,
    returnByValue: true,
    expression: `(() => {
      const fm = window.farmingManager;
      const w = window.world;
      return {
        interactiveTiles: Array.from(fm.tiles.keys()),
        interactableCrops: w.interactables.filter(i => i.id.includes('carrot') || i.id.includes('pumpkin') || i.id.includes('wheat')).map(i => i.id)
      };
    })()`
  });
  console.log('--- PADDOCKS VS FARMING GRID ---');
  console.log(JSON.stringify(paddockData.result?.value, null, 2));

  chrome.kill();
}

run().catch(e => {
  console.error(e);
  chrome.kill();
});
