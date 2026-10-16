import { spawn } from 'child_process';

const chromePath = 'C:\\Users\\chlov\\AppData\\Local\\ms-playwright\\chromium-1234\\chrome-win64\\chrome.exe';

async function main() {
  const cp = spawn(chromePath, ['--headless=new', '--remote-debugging-port=9385']);
  await new Promise(r => setTimeout(r, 1500));
  const tabs = await (await fetch('http://127.0.0.1:9385/json')).json();
  const ws = new WebSocket(tabs[0].webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);

  let id = 1;
  const send = (m, p = {}) => new Promise((res, rej) => {
    const cur = id++;
    const h = e => {
      const d = JSON.parse(e.data);
      if (d.id === cur) { ws.removeEventListener('message', h); if (d.error) rej(d.error); else res(d.result); }
    };
    ws.addEventListener('message', h);
    ws.send(JSON.stringify({ id: cur, method: m, params: p }));
  });

  await send('Page.navigate', { url: 'http://localhost:5174/?started=1' });
  await new Promise(r => setTimeout(r, 4000));

  const out = await send('Runtime.evaluate', {
    awaitPromise: true,
    returnByValue: true,
    expression: `(async () => {
      const r = window.renderer;
      const p = window.player;
      const w = window.world;
      const fm = window.farmingManager;

      // Measure 60 animation frames
      const frameTimes = [];
      for (let i = 0; i < 60; i++) {
        const t0 = performance.now();
        await new Promise(res => requestAnimationFrame(res));
        frameTimes.push(performance.now() - t0);
      }
      const avgMs = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
      const fps = Math.round(1000 / avgMs);

      return {
        calls: r.info.render.calls,
        triangles: r.info.render.triangles,
        geometries: r.info.memory.geometries,
        textures: r.info.memory.textures,
        fps,
        avgMs: +avgMs.toFixed(2),
        tiles: fm.tiles.size
      };
    })()`
  });

  console.log('LIVE_BENCHMARK:', JSON.stringify(out.result.value, null, 2));
  cp.kill();
}

main().catch(console.error);
