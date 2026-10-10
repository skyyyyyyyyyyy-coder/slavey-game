import { spawn } from 'child_process';

const chromePath = 'C:\\Users\\chlov\\AppData\\Local\\ms-playwright\\chromium-1234\\chrome-win64\\chrome.exe';
const port = 9227;
const chrome = spawn(chromePath, [
  '--headless=new',
  '--no-sandbox',
  '--remote-debugging-port=' + port,
  'http://localhost:5174/?started=1'
], { stdio: 'ignore' });

setTimeout(async () => {
  try {
    const res = await fetch('http://127.0.0.1:' + port + '/json');
    const tabs = await res.json();
    const pageTab = tabs.find(t => t.type === 'page');
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

    const testEval = await send('Runtime.evaluate', {
      expression: `
        (function() {
          const results = [];
          const p = window.player;
          const w = window.world;
          const cw = window.world.world;

          // 1. Verify Player Body is null (no body in FP view)
          results.push({ name: 'Player Avatar is null (no FP body)', pass: p.avatar === null });

          // 2. Verify Cylinders Colliders are Registered for all trees
          results.push({ name: 'CollisionWorld has Cylinder Colliders', pass: cw.cylinders.length >= 30, count: cw.cylinders.length });

          // 3. Test Collision against Apple Tree (x: 19.5, z: -17.8)
          p.position.set(19.5, 1.2, -15.0);
          p.velocity.set(0, 0, -5.0);
          cw.resolveMovement(p, 0.5);
          const appleDist = Math.hypot(p.position.x - 19.5, p.position.z - (-17.8));
          results.push({
            name: 'Apple Tree stops player smoothly (accurate cylinder hitbox)',
            pass: appleDist >= 0.85 && appleDist < 1.0,
            dist: appleDist.toFixed(3)
          });

          // 4. Test Collision against Pine Tree (x: 14, z: 46) (South valley woodlands)
          p.position.set(14, 1.2, 43.0);
          p.velocity.set(0, 0, 5.0); // moving south into pine at z: 46
          cw.resolveMovement(p, 0.5);
          const pineDist = Math.hypot(p.position.x - 14, p.position.z - 46);
          results.push({
            name: 'Pine Tree stops player (accurate cylinder hitbox)',
            pass: pineDist >= 0.80 && pineDist < 1.0,
            dist: pineDist.toFixed(3)
          });

          // 5. Test Collision against Birch Tree (x: -16.5, z: -27.0)
          p.position.set(-16.5, 1.2, -25.0);
          p.velocity.set(0, 0, -5.0);
          cw.resolveMovement(p, 0.5);
          const birchDist = Math.hypot(p.position.x - (-16.5), p.position.z - (-27.0));
          results.push({
            name: 'Birch Tree stops player with accurate cylinder hitbox',
            pass: birchDist >= 0.65 && birchDist < 0.85,
            dist: birchDist.toFixed(3)
          });

          // 6. Verify No Wildflower Lollipop Meshes in Scene
          let wildflowerCount = 0;
          w.scene.traverse(obj => {
            if (obj.material && obj.material.color && (obj.material.color.getHex() === 0xfacc15 || obj.material.color.getHex() === 0x38bdf8 || obj.material.color.getHex() === 0xf43f5e)) {
              if (obj.geometry && obj.geometry.type === 'SphereGeometry' && obj.geometry.parameters.radius < 0.12) {
                wildflowerCount++;
              }
            }
          });
          results.push({ name: 'Zero colorful lollipop wildflowers on ground', pass: wildflowerCount === 0, count: wildflowerCount });

          // 7. Verify smooth tree materials (no flatShading on leaf materials)
          results.push({
            name: 'Tree Foliage Materials have smooth shading (flatShading: false)',
            pass: !w.materials.leafVibrant.flatShading && !w.materials.leafDeep.flatShading && !w.materials.leafPine.flatShading && !w.materials.birchLeaf.flatShading
          });

          return results;
        })()
      `,
      returnByValue: true
    });

    console.log('TREE & COLLISION QA RESULTS:');
    console.log(JSON.stringify(testEval.result, null, 2));

    chrome.kill();
    process.exit(0);
  } catch(e) {
    console.error(e);
    chrome.kill();
    process.exit(1);
  }
}, 2500);
