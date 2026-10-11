import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const chromePath = 'C:\\Users\\chlov\\AppData\\Local\\ms-playwright\\chromium-1234\\chrome-win64\\chrome.exe';
const artifactDir = 'C:\\Users\\chlov\\.gemini\\antigravity\\brain\\ae1064fc-6b1a-4ed2-8e9f-297a7e6a7197';

const captures = [
  {
    id: '01_farmhouse_contact',
    name: 'Farmhouse Contact & Grounding',
    preset: 'house-exterior',
    time: 'midday',
    desc: 'Farmhouse foundation plinths, porch steps bed, and woodshed base fully grounded with zero air gaps'
  },
  {
    id: '02_spruce_closeup',
    name: 'Alpine Spruce Architectural Closeup',
    // Positioned looking north toward northern mountain perimeter spruce at (-25.0, -41.5)
    pos: { x: -25.0, y: 2.2, z: -35.0 },
    look: { yaw: 0.0, pitch: 0.16 },
    time: 'midday',
    desc: 'Handcrafted conifer tiers, drooping needle boughs, and rugged buttress trunk'
  },
  {
    id: '03_birch_closeup',
    name: 'Weeping Birch Architectural Closeup',
    // Closeup framing birch tree at (-16.5, -26) from east looking west-northwest
    pos: { x: -12.5, y: 1.8, z: -25.5 },
    look: { yaw: 1.35, pitch: 0.12 },
    time: 'midday',
    desc: 'Slender birch trunk, dark lenticel rings, sweeping branches, and chartreuse weeping foliage'
  },
  {
    id: '04_bush_closeup',
    name: 'Handcrafted Alpine Bush Closeup',
    // Stand in front of bush at (-9.0, 0, -18.5) looking north
    pos: { x: -9.0, y: 1.1, z: -16.0 },
    look: { yaw: 0.0, pitch: -0.15 },
    time: 'midday',
    desc: 'Handcrafted alpine currant bush with organic woody stems, faceted foliage, and ruby berries'
  },
  {
    id: '05_forest_spacing',
    name: 'Perimeter Woodland Spacing & Vistas',
    pos: { x: 0, y: 3.5, z: -18.0 },
    look: { yaw: 0.0, pitch: 0.10 },
    time: 'morning',
    desc: 'Spruce and birch spatial separation framing northern boundary wall and knoll'
  },
  {
    id: '06_vegetation_comparison',
    name: 'Cohesive Tree Palette Composition',
    // View from path framing orchard apple trees, knoll birches, and perimeter spruces together
    pos: { x: 9.0, y: 2.4, z: -10.0 },
    look: { yaw: 0.65, pitch: 0.08 },
    time: 'goldenhour',
    desc: 'Visual harmony among Apple trees, Weeping Birches, and Alpine Spruces'
  },
  {
    id: '07_hoe_tilling_interaction',
    name: 'Arable Paddock & Tilling Interaction',
    // Overlooking West Carrot Paddock interior turf with hoe active
    pos: { x: -15.5, y: 1.4, z: -9.0 },
    look: { yaw: 0.0, pitch: -0.25 },
    time: 'morning',
    desc: 'West Carrot paddock split-rail enclosure with natural turf and active hoe indicator'
  },
  {
    id: '08_connected_field',
    name: 'Connected 3x3 Demonstration Field',
    preset: 'c1-overview',
    time: 'midday',
    desc: 'Connected 3x3 demonstration field with continuous furrows and all four growth stages'
  },
  {
    id: '09_soil_watered_vs_dry',
    name: 'Watered vs Dry Soil Tile Comparison',
    preset: 'c1-soil',
    time: 'midday',
    desc: 'Micro-relief soil bed with authentic dry vs darkened watered moisture sheen'
  },
  {
    id: '10_full_meadow_composition',
    name: 'Full Meadow Valley Landscape Overview',
    // Elevated view looking north across entire estate towards chalet knoll
    pos: { x: 0, y: 9.0, z: 32.0 },
    look: { yaw: 0.0, pitch: -0.16 },
    time: 'goldenhour',
    desc: 'Complete integrated valley landscape featuring estate farmhouse, orchard, and perimeter forests'
  }
];

async function captureAll() {
  console.log('=== STARTING STAGE C1.1 COMPREHENSIVE PLAYTEST & EVIDENCE CAPTURE ===');

  const chrome = spawn(chromePath, [
    '--headless=new',
    '--no-sandbox',
    '--window-size=1920,1080',
    '--remote-debugging-port=9370'
  ], { stdio: 'ignore' });

  try {
    await new Promise(r => setTimeout(r, 1500));
    const tabs = await (await fetch('http://127.0.0.1:9370/json')).json();
    const pageTab = tabs.find(t => t.type === 'page');
    if (!pageTab) throw new Error('Could not find active page tab');

    const ws = new WebSocket(pageTab.webSocketDebuggerUrl);
    await new Promise(r => ws.onopen = r);

    let id = 1;
    const send = (method, params = {}) => new Promise((resolve, reject) => {
      const curId = id++;
      const handler = evt => {
        const d = JSON.parse(evt.data);
        if (d.id === curId) {
          ws.removeEventListener('message', handler);
          if (d.error) reject(d.error);
          else resolve(d.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id: curId, method, params }));
    });

    console.log('Navigating to game URL with ?started=1...');
    await send('Page.navigate', { url: 'http://localhost:5174/?started=1' });
    await new Promise(r => setTimeout(r, 3500));

    // Interactive Simulation & Live Metrics
    const simResults = await send('Runtime.evaluate', {
      awaitPromise: true,
      returnByValue: true,
      expression: `(async () => {
        const p = window.player;
        const w = window.world;
        const fm = window.farmingManager;
        const tm = window.timeManager;
        const r = window.renderer;

        // Stair climb test
        p.respawn(new THREE.Vector3(0, 0.05, -23.5));
        p.yaw = 0.0; p.pitch = 0.0;
        for (let step = 0; step < 25; step++) {
          p.position.z -= 0.12;
          p.world.resolveCollision(p.position, p.velocity, p.radius, p.height);
          await new Promise(res => requestAnimationFrame(res));
        }
        const porchY = p.position.y;
        const stairAscentSuccess = porchY >= 0.70;

        for (let step = 0; step < 25; step++) {
          p.position.z += 0.12;
          p.world.resolveCollision(p.position, p.velocity, p.radius, p.height);
          await new Promise(res => requestAnimationFrame(res));
        }
        const groundY = p.position.y;
        const stairDescentSuccess = groundY <= 0.20;

        // Door interaction test
        const door = w.interactables.find(i => i.id === 'house_front_door');
        let doorToggled = false;
        if (door) {
          door.interact(p);
          doorToggled = true;
        }

        // Benchmark FPS over 60 frames
        const frameTimes = [];
        for (let f = 0; f < 60; f++) {
          const t0 = performance.now();
          await new Promise(res => requestAnimationFrame(res));
          frameTimes.push(performance.now() - t0);
        }
        const avgFrameMs = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
        const fps = Math.round(1000 / avgFrameMs);

        // Count loaded model meshes
        let spruces = 0;
        let birches = 0;
        let bushes = 0;
        let apples = 0;
        w.scene.traverse(c => {
          if (c.isMesh) {
            const n = c.name || '';
            if (n.includes('tree_spruce') || n.includes('Spruce') || n.includes('Tier')) spruces++;
            if (n.includes('tree_birch') || n.includes('Birch') || n.includes('Lenticel')) birches++;
            if (n.includes('shrub_bush') || n.includes('Bush') || n.includes('Berry')) bushes++;
            if (n.includes('Apple') || n.includes('Canopy')) apples++;
          }
        });

        return {
          stairAscentSuccess,
          porchY: +porchY.toFixed(3),
          stairDescentSuccess,
          groundY: +groundY.toFixed(3),
          doorToggled,
          drawCalls: r.info.render.calls,
          triangles: r.info.render.triangles,
          geometries: r.info.memory.geometries,
          textures: r.info.memory.textures,
          fps,
          avgFrameMs: +avgFrameMs.toFixed(2),
          totalInteractiveTiles: fm.tiles.size,
          models: { spruces, birches, bushes, apples }
        };
      })()`
    });

    console.log('Playtest & Benchmark metrics:', JSON.stringify(simResults.result?.value, null, 2));

    const resolutions = [
      { w: 1920, h: 1080, suffix: '1920x1080' },
      { w: 1440, h: 900,  suffix: '1440x900' }
    ];

    for (const cap of captures) {
      console.log(`Capturing: ${cap.id} (${cap.name})...`);

      await send('Runtime.evaluate', {
        awaitPromise: true,
        expression: `(async () => {
          const tm = window.timeManager;
          const dn = window.dayNightCycle;
          const p = window.player;
          const fm = window.farmingManager;

          // Set time
          const t = '${cap.time}';
          if (t === 'morning') tm.setTime(8, 0);
          else if (t === 'midday') tm.setTime(12, 0);
          else if (t === 'goldenhour') tm.setTime(17, 0);
          else if (t === 'sunset') tm.setTime(18, 30);
          dn.update();

          // Set tool if needed
          if ('${cap.id}' === '07_hoe_tilling_interaction') {
            fm.activeToolIndex = 0; // Hoe
          }

          // Position camera
          ${cap.preset ? `
            const preset = '${cap.preset}';
            if (preset === 'house-exterior') { p.respawn(new THREE.Vector3(0, 1.2, -18.5)); p.yaw = 0.0; p.pitch = 0.12; }
            else if (preset === 'c1-overview') { p.respawn(new THREE.Vector3(-7.0, 1.35, 4.6)); p.yaw = 0.0; p.pitch = -0.35; }
            else if (preset === 'c1-soil') { p.respawn(new THREE.Vector3(-7.5, 0.2, 2.45)); p.yaw = Math.PI; p.pitch = -0.78; }
          ` : `
            p.respawn(new THREE.Vector3(${cap.pos.x}, ${cap.pos.y}, ${cap.pos.z}));
            p.yaw = ${cap.look.yaw};
            p.pitch = ${cap.look.pitch};
          `}

          // Wait 3 frames for clean render
          for (let f = 0; f < 3; f++) {
            await new Promise(res => requestAnimationFrame(res));
          }
        })()`
      });

      for (const res of resolutions) {
        await send('Emulation.setDeviceMetricsOverride', {
          width: res.w,
          height: res.h,
          deviceScaleFactor: 1,
          mobile: false
        });

        await send('Runtime.evaluate', {
          expression: `(() => {
            window.renderer.setSize(${res.w}, ${res.h});
            window.camera.aspect = ${res.w} / ${res.h};
            window.camera.updateProjectionMatrix();
          })()`
        });

        await new Promise(r => setTimeout(r, 200));

        const shot = await send('Page.captureScreenshot', { format: 'png' });
        const buf = Buffer.from(shot.data, 'base64');
        const fileName = `stage_c1_1_${cap.id}_${res.suffix}.png`;
        const outPath = path.join(artifactDir, fileName);
        fs.writeFileSync(outPath, buf);
      }
    }

    console.log('All 10 screenshot pairs re-captured with tuned camera angles!');
    chrome.kill();
    return simResults.result?.value;
  } catch (err) {
    console.error('Capture error:', err);
    chrome.kill();
    throw err;
  }
}

captureAll().then(metrics => {
  console.log('Done! Metrics:', metrics);
}).catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
