import { spawn } from 'child_process';

const chromePath = 'C:\\Users\\chlov\\AppData\\Local\\ms-playwright\\chromium-1234\\chrome-win64\\chrome.exe';
const testPort = 9274;
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
    const p = window.player;
    const w = window.world;
    const dt = 1 / 60;
    const report = { ascent: [], descent: [], smoothAscent: true, smoothDescent: true };

    // 1. Test Walking UP the stairs from yard (Z = -25.5) towards porch (Z = -28.2)
    p.respawn(new window.THREE.Vector3(0, 0.60, -25.5));
    p.velocity.set(0, 0, 0);

    for (let frame = 0; frame < 60; frame++) {
      // Walk forward in -Z direction at steady speed (2.5 m/s)
      p.velocity.z = -2.5;
      p.velocity.x = 0;
      w.world.resolveMovement(p, dt);
      report.ascent.push({
        frame,
        z: p.position.z.toFixed(2),
        y: p.position.y.toFixed(2),
        onGround: p.onGround
      });
      // Check if velocity or forward motion stopped unexpectedly (hit a wall)
      if (frame > 5 && p.position.z > -26.0 && p.velocity.z === 0) {
        report.smoothAscent = false;
      }
    }

    const finalAscentY = p.position.y;
    const finalAscentZ = p.position.z;
    report.ascentEnd = { z: finalAscentZ.toFixed(2), y: finalAscentY.toFixed(2) };
    report.ascentReachedPorch = finalAscentZ <= -27.8 && finalAscentY >= 1.40;

    // 2. Test Walking DOWN the stairs from porch (Z = -28.2) towards yard (Z = -25.5)
    p.respawn(new window.THREE.Vector3(0, 1.52, -28.2));
    p.velocity.set(0, 0, 0);

    for (let frame = 0; frame < 60; frame++) {
      // Walk backward in +Z direction at steady speed (2.5 m/s)
      p.velocity.z = 2.5;
      p.velocity.x = 0;
      w.world.resolveMovement(p, dt);
      report.descent.push({
        frame,
        z: p.position.z.toFixed(2),
        y: p.position.y.toFixed(2),
        onGround: p.onGround
      });
    }

    const finalDescentY = p.position.y;
    const finalDescentZ = p.position.z;
    report.descentEnd = { z: finalDescentZ.toFixed(2), y: finalDescentY.toFixed(2) };
    report.descentReachedYard = finalDescentZ >= -26.0 && finalDescentY <= 0.70;

    return report;
  })()`,
  returnByValue: true
});

console.log('Stair Traversal Physics Simulation:');
console.log('Ascent Reached Porch:', evalResult.result.value.ascentReachedPorch);
console.log('Ascent End Pos:', evalResult.result.value.ascentEnd);
console.log('Descent Reached Yard:', evalResult.result.value.descentReachedYard);
console.log('Descent End Pos:', evalResult.result.value.descentEnd);
console.log('\nSample Ascent trajectory:');
const asc = evalResult.result.value.ascent;
for (let i = 0; i < asc.length; i += 10) {
  console.log(`  Frame ${asc[i].frame}: Z = ${asc[i].z}, Y = ${asc[i].y}, Grounded: ${asc[i].onGround}`);
}
console.log('\nSample Descent trajectory:');
const desc = evalResult.result.value.descent;
for (let i = 0; i < desc.length; i += 10) {
  console.log(`  Frame ${desc[i].frame}: Z = ${desc[i].z}, Y = ${desc[i].y}, Grounded: ${desc[i].onGround}`);
}

chrome.kill();
