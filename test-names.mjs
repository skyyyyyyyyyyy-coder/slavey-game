import { spawn } from 'child_process';

const chromePath = 'C:\\Users\\chlov\\AppData\\Local\\ms-playwright\\chromium-1234\\chrome-win64\\chrome.exe';
const chrome = spawn(chromePath, ['--headless=new', '--remote-debugging-port=9366'], { stdio: 'ignore' });

async function run() {
  await new Promise(r => setTimeout(r, 1500));
  const tabs = await (await fetch('http://127.0.0.1:9366/json')).json();
  const pageTab = tabs.find(t => t.type === 'page');
  const ws = new WebSocket(pageTab.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);

  let id = 1;
  const send = (method, params = {}) => new Promise(res => {
    const curId = id++;
    const handler = evt => {
      const d = JSON.parse(evt.data);
      if (d.id === curId) { ws.removeEventListener('message', handler); res(d.result); }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id: curId, method, params }));
  });

  await send('Page.navigate', { url: 'http://localhost:5174/?started=1' });
  await new Promise(r => setTimeout(r, 3500));

  const res = await send('Runtime.evaluate', {
    awaitPromise: true,
    returnByValue: true,
    expression: `(() => {
      const allNames = [];
      window.world.scene.traverse(c => {
        if (c.isMesh) {
          allNames.push(c.name || 'unnamed_' + c.geometry?.type);
        }
      });
      return {
        total: allNames.length,
        namesSample: allNames.slice(0, 30),
        spruceMeshes: allNames.filter(n => n.includes('Spruce') || n.includes('spruce')),
        birchMeshes: allNames.filter(n => n.includes('Birch') || n.includes('birch')),
        bushMeshes: allNames.filter(n => n.includes('Bush') || n.includes('bush') || n.includes('shrub'))
      };
    })()`
  });

  console.log('Result:', JSON.stringify(res.result?.value, null, 2));
  chrome.kill();
}

run().catch(e => { console.error(e); chrome.kill(); });
