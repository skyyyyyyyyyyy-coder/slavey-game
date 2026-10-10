import { spawn } from 'child_process';

const chromePath = 'C:\\Users\\chlov\\AppData\\Local\\ms-playwright\\chromium-1234\\chrome-win64\\chrome.exe';
const port = 9225;

console.log('Launching headless Chrome for Phase 2 QA on port ' + port);
const chrome = spawn(chromePath, [
  '--headless=new',
  '--no-sandbox',
  `--remote-debugging-port=${port}`,
  'http://localhost:5174/?started=1'
], { stdio: 'ignore' });

await new Promise(r => setTimeout(r, 2000));

try {
  const res = await fetch(`http://127.0.0.1:${port}/json`);
  const tabs = await res.json();
  const pageTab = tabs.find(t => t.type === 'page' || t.url.includes('localhost'));

  if (!pageTab) {
    console.error('Could not find active page tab:', tabs);
    process.exit(1);
  }

  const ws = new WebSocket(pageTab.webSocketDebuggerUrl);
  let idCounter = 1;
  const pending = new Map();
  const consoleMessages = [];

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.method === 'Runtime.consoleAPICalled') {
      consoleMessages.push(msg.params.args.map(a => a.value).join(' '));
    }
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)(msg.result);
      pending.delete(msg.id);
    }
  };

  await new Promise(r => ws.onopen = r);

  function send(method, params = {}) {
    const id = idCounter++;
    return new Promise(resolve => {
      pending.set(id, resolve);
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  await send('Runtime.enable');
  await send('Page.enable');

  // Let game settle
  await new Promise(r => setTimeout(r, 1200));

  const evaluation = await send('Runtime.evaluate', {
    expression: `
      (async function() {
        const results = {
          checks: [],
          fps: 0,
          passCount: 0,
          failCount: 0
        };

        function assert(name, condition, details = '') {
          if (condition) {
            results.checks.push({ name, status: 'PASS', details });
            results.passCount++;
          } else {
            results.checks.push({ name, status: 'FAIL', details });
            results.failCount++;
          }
        }

        const p = window.player;
        const w = window.world;
        const tm = window.timeManager;
        const sm = window.saveManager;
        const dn = window.dayNightCycle;

        // 1. Systems Existence
        assert('Player Exists', !!p);
        assert('World Exists', !!w);
        assert('TimeManager Exists', !!tm && typeof tm.update === 'function');
        assert('DayNightCycle Exists', !!dn && !!dn.sunLight && !!dn.moonLight);
        assert('SaveManager Exists', !!sm && typeof sm.save === 'function');

        // 2. In-Game Clock & Calendar Initial State
        assert('Default Starting Hour is 08:00 AM', tm.hour === 8, 'Time: ' + tm.getFormattedTime());
        assert('Default Season & Day is Spring 1', tm.season === 'Spring' && tm.day === 1, 'Date: ' + tm.getFormattedDate());
        assert('Default TimeScale is 60.0 (24min = 1 day)', Math.abs(tm.timeScale - 60.0) < 0.1, 'TimeScale: ' + tm.timeScale);

        // 3. Time Progression
        const startSec = tm.second;
        const startMin = tm.minute;
        // Advance 1.5 real seconds (should be ~90 in-game seconds = 1.5 in-game minutes)
        for (let i = 0; i < 45; i++) {
          await new Promise(r => setTimeout(r, 33));
        }
        assert('Time Advances Correctly with Real Time', tm.minute > startMin || tm.second !== startSec, 'Current: ' + tm.getFormattedTime());

        // 4. Pause Behavior
        tm.pause();
        const pauseMin = tm.minute;
        const pauseSec = tm.second;
        for (let i = 0; i < 15; i++) {
          await new Promise(r => setTimeout(r, 30));
        }
        assert('Time Progression Halts While Paused', tm.minute === pauseMin && Math.abs(tm.second - pauseSec) < 0.05, 'Paused Sec: ' + tm.second);
        tm.resume();

        // 5. Day Rollover Test
        tm.setTime(23, 59);
        tm.second = 55;
        // Advance 10 in-game seconds
        tm.update(0.2); // 0.2 * 60 = 12 in-game seconds -> rolls over to midnight
        assert('Day Rollover Increments Day from 1 to 2', tm.day === 2 && tm.hour === 0, 'Rollover Date: ' + tm.getFormattedDate() + ' ' + tm.getFormattedTime());
        // Reset to morning for consistency
        tm.setTime(8, 0);
        tm.day = 1;

        // 6. Day/Night Dynamic Transitions Across All 7 Time Checkpoints
        // 6a. 06:30 Sunrise (Apricot / Peach Glow & Morning Mist)
        tm.setTime(6, 30);
        dn.update();
        const riseSunInt = dn.sunLight.intensity;
        const riseSunPos = dn.sunLight.position;
        const riseFogColor = w.scene.fog.color;
        const riseFogDensity = w.scene.fog.density;
        assert('06:30 Sunrise Sun is Rising in East with Low Altitude', riseSunInt > 1.0 && riseSunPos.x > 100 && riseSunPos.y < 45, 'X: ' + riseSunPos.x.toFixed(1) + ', Y: ' + riseSunPos.y.toFixed(1));
        assert('06:30 Sunrise Atmosphere Has Warm Peach Mist', riseFogDensity >= 0.004 && riseFogColor.r > riseFogColor.b, 'Fog R: ' + riseFogColor.r.toFixed(2) + ', B: ' + riseFogColor.b.toFixed(2));

        // 6b. 08:00 Morning (Warm Buttery Gold)
        tm.setTime(8, 0);
        dn.update();
        const mornSunInt = dn.sunLight.intensity;
        const mornMoonInt = dn.moonLight.intensity;
        assert('08:00 Morning Sun is Bright and Moon is Off', mornSunInt > 1.3 && mornMoonInt === 0, 'Sun: ' + mornSunInt + ', Moon: ' + mornMoonInt);

        // 6c. 12:00 Midday (Crisp Overhead Sun & High Mountain Clarity)
        tm.setTime(12, 0);
        dn.update();
        const midSunY = dn.sunLight.position.y;
        const midFogDensity = w.scene.fog.density;
        assert('12:00 Midday Sun is High Overhead with Crisp Mountain Clarity', midSunY > 140 && midFogDensity <= 0.0032, 'Sun Y: ' + midSunY.toFixed(1) + ', Fog: ' + midFogDensity);

        // 6d. 17:00 Golden Hour (Rich Amber Sunlight & West Shadows)
        tm.setTime(17, 0);
        dn.update();
        const goldSunPos = dn.sunLight.position;
        const goldSunColor = dn.sunLight.color;
        assert('17:00 Golden Hour Sun is Descending in West with Rich Amber Color', goldSunPos.x < -100 && goldSunColor.r > 0.9 && goldSunColor.b < 0.2, 'X: ' + goldSunPos.x.toFixed(1) + ', Color: ' + JSON.stringify(goldSunColor));

        // 6e. 18:30 Sunset (Rosy Terracotta / Salmon Pink Horizon & Warm Mist - NOT BLUE!)
        tm.setTime(18, 30);
        dn.update();
        const sunsetSunInt = dn.sunLight.intensity;
        const sunsetFogColor = w.scene.fog.color;
        assert('18:30 Sunset Sun is Low Ember', sunsetSunInt > 0.8 && dn.sunLight.position.y < 35, 'Sun: ' + sunsetSunInt);
        assert('18:30 Sunset Fog Synchronized with Warm Rosy Horizon (Not Blue!)', sunsetFogColor.r > sunsetFogColor.b, 'Fog R: ' + sunsetFogColor.r.toFixed(2) + ', B: ' + sunsetFogColor.b.toFixed(2));

        // 6f. 19:30 Twilight (Dusty Violet / Lavender Slate, Emerging Stars, Glowing Windows)
        tm.setTime(19, 30);
        dn.update();
        const twiStars = dn.starMaterial.opacity;
        const twiWindowGlow = dn.windowMaterial.emissiveIntensity;
        assert('19:30 Twilight Features Emerging Stars and Cozy Window Glow', twiStars > 0.5 && twiWindowGlow >= 0.85, 'Stars: ' + twiStars + ', Windows: ' + twiWindowGlow);

        // 6g. 22:30 Nighttime (Deep Midnight Navy, Stars & Silvery Moonlight)
        tm.setTime(22, 30);
        dn.update();
        const nightSunInt = dn.sunLight.intensity;
        const nightMoonInt = dn.moonLight.intensity;
        const nightStars = dn.starMaterial.opacity;
        const nightWindowGlow = dn.windowMaterial.emissiveIntensity;
        assert('22:30 Nighttime Moon is Illuminated and Sun is Down', nightSunInt === 0 && nightMoonInt > 0.4, 'Sun: ' + nightSunInt + ', Moon: ' + nightMoonInt);
        assert('22:30 Nighttime Starfield is Fully Twinkling with Chalet Windows Lit', nightStars > 0.85 && nightWindowGlow >= 0.90, 'Stars: ' + nightStars + ', Windows: ' + nightWindowGlow);

        // Reset to morning 08:00
        tm.setTime(8, 0);
        dn.update();

        // 7. Save and Reload State
        // Move player to custom test position
        p.position.set(7.5, 1.2, -18.2);
        p.yaw = 1.35;
        p.pitch = -0.12;
        p.stamina = 82;

        // Harvest a carrot
        const carrot = w.interactables.find(i => i.name === 'Carrot Plant');
        let initialCarrots = p.backpack.find(b => b.id === 'carrot').count;
        carrot.interact(p);
        const harvestedCarrots = p.backpack.find(b => b.id === 'carrot').count;
        assert('Carrot Harvested into Backpack', harvestedCarrots === initialCarrots + 1, 'Carrots: ' + harvestedCarrots);
        assert('Harvested Carrot is in Cooldown State', !carrot.ready && carrot.growTimer > 5.0, 'GrowTimer: ' + carrot.growTimer);

        // Perform Save
        const saveOk = sm.save('test_suite');
        assert('SaveManager.save() Returns True', saveOk === true);
        assert('hasSaveData() Returns True', sm.hasSaveData() === true);

        // Modify local state to simulate reset
        p.position.set(0, 0, 0);
        p.backpack.find(b => b.id === 'carrot').count = 0;
        carrot.ready = true;
        carrot.growTimer = 0;

        // Load Save Data
        const loaded = sm.load();
        assert('SaveManager.load() Returns Valid Object', !!loaded && (loaded.schemaVersion === 1 || loaded.schemaVersion === 2));

        // Restore onto game
        p.restoreState(loaded.player);
        w.restoreCropsAndFruits(loaded.world.crops, loaded.world.fruits);
        tm.deserialize(loaded.time);

        // 8. Validations after Reload
        assert('Player Position Restored Accurately', Math.abs(p.position.x - 7.5) < 0.05 && Math.abs(p.position.z - (-18.2)) < 0.05, 'Pos: ' + JSON.stringify(p.position));
        assert('Inventory Persisted Accurately', p.backpack.find(b => b.id === 'carrot').count === harvestedCarrots, 'Carrots after load: ' + p.backpack.find(b => b.id === 'carrot').count);
        assert('Harvest Cooldown Persisted Accurately (No Instant Regrow)', !carrot.ready && carrot.growTimer > 0, 'Carrot ready: ' + carrot.ready + ', timer: ' + carrot.growTimer);

        // 9. No Duplicate Harvest Rewards Verification
        // Attempting to interact with the unready crop must NOT give rewards
        const carrotCountBefore = p.backpack.find(b => b.id === 'carrot').count;
        carrot.interact(p);
        const carrotCountAfter = p.backpack.find(b => b.id === 'carrot').count;
        assert('No Duplicate Harvest Rewards While on Cooldown', carrotCountBefore === carrotCountAfter, 'Count: ' + carrotCountAfter);

        // 10. Corrupt Save Data Recovery Test
        localStorage.setItem('meadow_valley_save_v1', '{corrupt json data!!!');
        const corruptRecovered = sm.load();
        assert('Corrupt Save Gracefully Returns Null Without Crash', corruptRecovered === null);
        assert('Corrupt Save Backed Up for Recovery', !!localStorage.getItem('meadow_valley_save_corrupt_backup'));

        // Restore clean test save
        sm.save('clean_restore');

        // 11. Performance Measurement
        let frames = 0;
        const fpsStart = performance.now();
        while (performance.now() - fpsStart < 500) {
          frames++;
          await new Promise(r => requestAnimationFrame(r));
        }
        const fps = Math.round((frames / (performance.now() - fpsStart)) * 1000);
        results.fps = fps;
        assert('Framerate Meets or Exceeds 60 FPS Target', fps >= 60, 'Measured: ' + fps + ' FPS');

        return results;
      })()
    `,
    awaitPromise: true,
    returnByValue: true
  });

  const resVal = evaluation.result.value;
  console.log('\n=== PHASE 2 COMPREHENSIVE AUTOMATED QA REPORT ===');
  resVal.checks.forEach(c => {
    console.log(`[${c.status}] ${c.name} ${c.details ? '(' + c.details + ')' : ''}`);
  });

  console.log(`\nOverall: ${resVal.passCount} PASSED, ${resVal.failCount} FAILED`);
  console.log(`Measured Performance: ${resVal.fps} FPS`);
  console.log(`Console Logs: ${consoleMessages.join('\n')}`);

  await send('Browser.close');
  process.exit(resVal.failCount > 0 ? 1 : 0);
} catch (err) {
  console.error('Test runner failed:', err);
  process.exit(1);
}
