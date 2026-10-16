import { spawn } from 'child_process';

const chromePath = 'C:\\Users\\chlov\\AppData\\Local\\ms-playwright\\chromium-1234\\chrome-win64\\chrome.exe';
const chrome = spawn(chromePath, ['--headless=new', '--remote-debugging-port=9328', 'http://localhost:5174/?started=1'], { stdio: 'ignore' });

async function check() {
  await new Promise(r => setTimeout(r, 4000));
  const tabs = await (await fetch('http://127.0.0.1:9328/json')).json();
  const pageTab = tabs.find(t => t.type === 'page' || t.url.includes('localhost'));
  const ws = new WebSocket(pageTab.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);

  let id = 1;
  const send = (method, params) => new Promise(res => {
    const curId = id++;
    const handler = evt => {
      const d = JSON.parse(evt.data);
      if (d.id === curId) { ws.removeEventListener('message', handler); res(d.result); }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id: curId, method, params }));
  });

  const res = await send('Runtime.evaluate', {
    awaitPromise: true,
    returnByValue: true,
    expression: `(async () => {
      const r = window.renderer;
      const w = window.world;
      if (!r || !w) return { error: 'renderer or world not found on window' };

      let bushes = 0;
      let spruces = 0;
      let birches = 0;
      let apples = 0;
      
      w.scene.traverse(c => {
        if (c.isMesh) {
          const n = c.name || '';
          if (n.includes('shrub_bush') || n.includes('Bush')) bushes++;
          if (n.includes('tree_spruce') || n.includes('Spruce') || n.includes('Tier') || n.includes('Needle')) spruces++;
          if (n.includes('tree_birch') || n.includes('Birch')) birches++;
          if (n.includes('Apple') || n.includes('Canopy') || n.includes('Trunk')) apples++;
        }
      });

      return {
        render: {
          drawCalls: r.info.render.calls,
          triangles: r.info.render.triangles,
          geometries: r.info.memory.geometries,
          textures: r.info.memory.textures
        },
        models: {
          bushes,
          spruces,
          birches,
          apples
        }
      };
    })()`
  });

  console.log('Result:', JSON.stringify(res.result?.value, null, 2));
  chrome.kill();
}

check().catch(e => { console.error(e); chrome.kill(); });
