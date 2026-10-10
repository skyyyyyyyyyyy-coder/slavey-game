import { spawn } from 'child_process';

const chrome = spawn('C:\\Users\\chlov\\AppData\\Local\\ms-playwright\\chromium-1234\\chrome-win64\\chrome.exe', [
  '--headless=new', '--no-sandbox', '--window-size=1920,1080', '--remote-debugging-port=9320',
  'http://localhost:5174/?started=1&cam=blender-tree&time=12:00'
], { stdio: 'ignore' });

setTimeout(async () => {
  try {
    const res = await fetch('http://127.0.0.1:9320/json');
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

    await new Promise(r => setTimeout(r, 1600));

    const r = await send('Runtime.evaluate', {
      expression: `(() => {
        const fruit = window.world.interactables.find(i => i.id === 'apple_tree_3_fruit_0');
        const countBefore = window.player.backpack.find(i => i.id === 'apple')?.count || 0;
        let picked = false;
        if (fruit && fruit.ready) {
          fruit.interact(window.player);
          picked = true;
        }
        const countAfter = window.player.backpack.find(i => i.id === 'apple')?.count || 0;

        return JSON.stringify({
          fruitFound: !!fruit,
          fruitName: fruit ? fruit.name : null,
          hasMesh: fruit ? !!fruit.mesh : false,
          picked,
          countBefore,
          countAfter,
          appleScaleX: fruit && fruit.mesh ? fruit.mesh.scale.x : null,
          growTimer: fruit ? fruit.growTimer : null,
          drawCalls: window.renderer.info.render.calls,
          triangles: window.renderer.info.render.triangles,
          geometries: window.renderer.info.memory.geometries,
          textures: window.renderer.info.memory.textures
        });
      })()`
    });

    console.log('PARSED_OUTPUT:', r.result.value);
    ws.close();
    chrome.kill();
  } catch (err) {
    console.error(err);
    chrome.kill();
  }
}, 2200);
