import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const chromePath = 'C:\\Users\\chlov\\AppData\\Local\\ms-playwright\\chromium-1234\\chrome-win64\\chrome.exe';
const artifactDir = 'C:\\Users\\chlov\\.gemini\\antigravity\\brain\\ae1064fc-6b1a-4ed2-8e9f-297a7e6a7197';
const localScreenshotsDir = path.resolve('screenshots');

if (!fs.existsSync(localScreenshotsDir)) {
  fs.mkdirSync(localScreenshotsDir, { recursive: true });
}

const captures = [
  {
    id: '01_new_spruce_closeup',
    name: 'New Handcrafted Alpine Spruce Close-up',
    pos: { x: -25.0, y: 2.2, z: -35.0 },
    look: { yaw: 0.0, pitch: 0.16 },
    time: 'midday',
    desc: 'Tiered drooping conifer boughs, rugged buttress roots, dark organic bark, and rich vertex-colored needles'
  },
  {
    id: '02_new_birch_closeup',
    name: 'New Handcrafted Weeping Birch Close-up',
    pos: { x: -11.0, y: 2.2, z: -24.5 },
    look: { yaw: 1.25, pitch: 0.15 },
    time: 'midday',
    desc: 'Gracefully sweeping S-curved white trunk with dark lenticels, organic branching, and chartreuse weeping leaf clouds'
  },
  {
    id: '03_new_bush_closeup',
    name: 'New Handcrafted Alpine Currant Bush Close-up',
    pos: { x: -9.0, y: 1.0, z: -16.2 },
    look: { yaw: 0.0, pitch: -0.15 },
    time: 'midday',
    desc: 'Multi-stem woody core, layered leaf lobes, and white alpine blossoms with pistils'
  },
  {
    id: '04_new_well_closeup',
    name: 'New Handcrafted Stone Farm Well Close-up',
    pos: { x: -13.2, y: 1.45, z: -5.8 },
    look: { yaw: 0.65, pitch: -0.10 },
    time: 'midday',
    desc: 'Dressed limestone curb, coping stones, timber A-frame, shingled gable canopy, winch drum, hemp rope, iron crank, bucket, and water'
  },
  {
    id: '05_new_fence_closeup',
    name: 'New 3D Split-Rail Wooden Fence Close-up',
    pos: { x: -10.5, y: 1.2, z: -7.5 },
    look: { yaw: 0.7, pitch: -0.2 },
    time: 'midday',
    desc: 'Hand-hewn split-rail timber segment, pyramid-chamfered posts, flared root collar, octagonal rails, and joinery pegs'
  },
  {
    id: '06_improved_cloud_composition',
    name: 'Improved Volumetric Cloud Composition',
    pos: { x: 0, y: 2.5, z: 0 },
    look: { yaw: 2.8, pitch: 0.35 },
    time: 'morning',
    desc: '16 curated volumetric formations (towering vertical build-ups, mid-level banks, wispy decks) with atmospheric undersides'
  },
  {
    id: '07_mountain_depth_and_contrast',
    name: 'Alpine Mountain Depth, Ridges, and Contrast',
    pos: { x: 0, y: 3.5, z: 0 },
    look: { yaw: 0.0, pitch: 0.14 },
    time: 'midday',
    desc: 'Sweeping mountain ranges with 4 tonal materials, dramatic cliff ridges, saddles, and crisp faceted snowcaps'
  },
  {
    id: '08_grassy_foothill_transition',
    name: 'Grassy Foothill & Mountain Slope Transition',
    pos: { x: 34.0, y: 2.2, z: -3.0 },
    look: { yaw: -1.57, pitch: 0.08 },
    time: 'midday',
    desc: 'Rolling foothill green mounds, weathered Dodecahedron boulder clusters, and wildflower accents transitioning from meadow to mountain'
  },
  {
    id: '09_wide_world_composition',
    name: 'Wide Shot of Corrected World Composition',
    pos: { x: 0, y: 9.5, z: 32.0 },
    look: { yaw: 0.0, pitch: -0.16 },
    time: 'goldenhour',
    desc: 'Harmonious composition featuring estate farmhouse, terrace wall, orchards, paddocks, well plaza, road, forest belt, and mountain panorama'
  },
  {
    id: '10_farm_fields_no_trees',
    name: 'Farm Area Proving No Trees in Active Fields',
    pos: { x: 0, y: 12.0, z: 0 },
    look: { yaw: 0.0, pitch: -0.55 },
    time: 'midday',
    desc: 'Top-down aerial view proving all 4 agricultural paddocks are completely clear of trees, with clean split-rail borders and 3x3 demo carrot field'
  },
  {
    id: '11_before_after_comparison',
    name: 'Before/After Environmental Integration View',
    pos: { x: -11.0, y: 1.6, z: -3.5 },
    look: { yaw: 0.42, pitch: 0.08 },
    time: 'midday',
    desc: 'Ground-level view along garden lane framing well, paddock fence, birches, spruces, and bushes working in harmony'
  },
  {
    id: '12_sunset_vs_daytime_lighting',
    name: 'Sunset vs Daytime Lighting & Atmospheric Fog',
    pos: { x: 0, y: 9.5, z: 32.0 },
    look: { yaw: 0.0, pitch: -0.16 },
    time: 'sunset',
    desc: 'Warm alpine alpenglow, glowing windows, sunset sky gradient, atmospheric fog, and dusk illumination across the homestead'
  }
];

async function captureAll() {
  console.log('=== STARTING MAJOR ENVIRONMENT OVERHAUL CANONICAL CAPTURE ===');

  const chrome = spawn(chromePath, [
    '--headless=new',
    '--no-sandbox',
    '--window-size=1920,1080',
    '--remote-debugging-port=9375'
  ], { stdio: 'ignore' });

  try {
    await new Promise(r => setTimeout(r, 2000));
    const tabs = await (await fetch('http://127.0.0.1:9375/json')).json();
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

    // Measure live performance metrics
    const simResults = await send('Runtime.evaluate', {
      awaitPromise: true,
      returnByValue: true,
      expression: `(async () => {
        const p = window.player;
        const w = window.world;
        const fm = window.farmingManager;
        const tm = window.timeManager;
        const r = window.renderer;

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
        let wells = 0;
        let fences = 0;
        let apples = 0;
        w.scene.traverse(c => {
          if (c.isMesh) {
            const n = c.name || '';
            if (n.includes('tree_spruce') || n.includes('Spruce') || n.includes('spruce')) spruces++;
            if (n.includes('tree_birch') || n.includes('Birch') || n.includes('birch')) birches++;
            if (n.includes('shrub_bush') || n.includes('Bush') || n.includes('bush')) bushes++;
            if (n.includes('well_') || n.includes('Stone Well')) wells++;
            if (n.includes('fence_') || n.includes('Fence')) fences++;
            if (n.includes('Apple') || n.includes('Canopy')) apples++;
          }
        });

        return {
          drawCalls: r.info.render.calls,
          triangles: r.info.render.triangles,
          geometries: r.info.memory.geometries,
          textures: r.info.memory.textures,
          fps,
          avgFrameMs: +avgFrameMs.toFixed(2),
          models: { spruces, birches, bushes, wells, fences, apples }
        };
      })()`
    });

    console.log('Live Benchmark Metrics:', JSON.stringify(simResults.result?.value, null, 2));

    const resolutions = [
      { w: 1920, h: 1080, suffix: '1920x1080' },
      { w: 1440, h: 900,  suffix: '1440x900' }
    ];

    for (const cap of captures) {
      console.log(`\nCapturing: ${cap.id} (${cap.name})...`);

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
          else if (t === 'goldenhour') tm.setTime(17, 30);
          else if (t === 'sunset') tm.setTime(18, 15);
          dn.update();

          // Position camera
          p.respawn(new THREE.Vector3(${cap.pos.x}, ${cap.pos.y}, ${cap.pos.z}));
          p.yaw = ${cap.look.yaw};
          p.pitch = ${cap.look.pitch};

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

        await new Promise(r => setTimeout(r, 250));

        const shot = await send('Page.captureScreenshot', {
          format: 'png',
          fromSurface: true
        });

        const buf = Buffer.from(shot.data, 'base64');
        const fileName = `env_overhaul_${cap.id}_${res.suffix}.png`;

        // Save to artifact directory
        const artifactPath = path.join(artifactDir, fileName);
        fs.writeFileSync(artifactPath, buf);

        // Save to local screenshots directory
        const localPath = path.join(localScreenshotsDir, fileName);
        fs.writeFileSync(localPath, buf);

        console.log(`  ✓ Saved ${fileName} (${buf.length} bytes)`);
      }
    }

    console.log('\n=== ALL 12 CANONICAL CAPTURES COMPLETED SUCCESSFULLY ===');
  } catch (err) {
    console.error('Fatal capture error:', err);
  } finally {
    chrome.kill();
  }
}

captureAll();
