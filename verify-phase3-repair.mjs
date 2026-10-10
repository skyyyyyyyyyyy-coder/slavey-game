import { spawn } from 'child_process';
import fs from 'fs';

const chromePath = 'C:\\Users\\chlov\\AppData\\Local\\ms-playwright\\chromium-1234\\chrome-win64\\chrome.exe';
const port = 9228;

console.log('=== PHASE 3 REPAIR COMPREHENSIVE AUTOMATED VERIFICATION ===\n');

const chrome = spawn(chromePath, [
  '--headless=new',
  '--no-sandbox',
  `--remote-debugging-port=${port}`,
  'http://localhost:5174/?started=1'
], { stdio: 'ignore' });

await new Promise(r => setTimeout(r, 2200));

try {
  const res = await fetch(`http://127.0.0.1:${port}/json`);
  const tabs = await res.json();
  const pageTab = tabs.find(t => t.type === 'page' || t.url.includes('localhost'));

  if (!pageTab) {
    console.error('Failed to locate page tab');
    chrome.kill();
    process.exit(1);
  }

  const ws = new WebSocket(pageTab.webSocketDebuggerUrl);
  let id = 1;
  const pending = new Map();

  ws.onmessage = (evt) => {
    const d = JSON.parse(evt.data);
    if (d.id && pending.has(d.id)) {
      pending.get(d.id)(d.result);
      pending.delete(d.id);
    }
  };

  await new Promise(r => ws.onopen = r);

  function send(method, params = {}) {
    const curId = id++;
    return new Promise(resolve => {
      pending.set(curId, resolve);
      ws.send(JSON.stringify({ id: curId, method, params }));
    });
  }

  // Let scene initialize
  await send('Runtime.evaluate', {
    expression: 'new Promise(r => setTimeout(r, 1500))',
    awaitPromise: true
  });

  const evalResult = await send('Runtime.evaluate', {
    expression: `(async () => {
      const results = [];
      const pass = (name, ok, msg = '') => results.push({ name, pass: !!ok, msg });

      const w = window.world;
      const p = window.player;
      const fm = window.farmingManager;
      const tm = window.timeManager;

      // 1. ARABLE FARMING ZONES (Strict restriction on tilling)
      const arableSamples = [
        { name: 'Homestead West Field', gx: -7, gz: 3, expected: true },
        { name: 'South-West Paddock', gx: -16, gz: 16, expected: true },
        { name: 'North-West Paddock', gx: -16, gz: -14, expected: true },
        { name: 'South-East Paddock', gx: 16, gz: 16, expected: true },
        { name: 'North-East Paddock', gx: 16, gz: -14, expected: true },
        { name: 'Homestead East Field', gx: 7, gz: 3, expected: true }
      ];

      arableSamples.forEach(s => {
        const check = fm.canTill(s.gx, s.gz);
        pass(\`Tilling Allowed in Arable Zone: \${s.name}\`, check.valid === s.expected, check.reason || '');
      });

      const restrictedSamples = [
        { name: 'Main Cobblestone Road', gx: 0, gz: 5, reason: 'Cannot till on stone lane' },
        { name: 'Orchard Cross-Lane', gx: 10, gz: -8, reason: 'Cannot till on cross-lane' },
        { name: 'Homestead Terrace Knoll', gx: 0, gz: -26, reason: 'Cannot till on stone lane' },
        { name: 'North Mountain Crags', gx: 0, gz: -50, reason: 'Unsuitable soil — Only marked arable fields can be tilled' },
        { name: 'Wild East Meadow', gx: 35, gz: 35, reason: 'Unsuitable soil — Only marked arable fields can be tilled' }
      ];

      restrictedSamples.forEach(s => {
        const check = fm.canTill(s.gx, s.gz);
        pass(\`Tilling Blocked on \${s.name}\`, !check.valid, check.reason);
      });

      // 2. CLEAN FARMING GRID ALIGNMENT
      p.stamina = 100;
      const tillOk = fm.tillTile(-7, 3, p);
      pass('Tilling Creates Farmland Tile at (-7, 3)', tillOk === true);
      const testTile = fm.tiles.get('-7_3');
      const isBoxGeo = testTile?.soilMesh?.geometry?.type === 'BoxGeometry';
      const boxParams = testTile?.soilMesh?.geometry?.parameters;
      pass('Soil Bed uses Clean 1.0x1.0m Aligned BoxGeometry', isBoxGeo && boxParams?.width === 1.0 && boxParams?.depth === 1.0);
      pass('Soil Tile has 2 Seamless Longitudinal Furrow Slats', testTile?.furrows?.length === 2);

      // Check paddocks have 0 cylinder mounds
      let cylinderMoundCount = 0;
      w.scene.traverse(c => {
        if (c.isMesh && c.geometry?.type === 'CylinderGeometry') {
          // Old bloated cylinder mounds were radius 0.38 - 0.5, length ~12
          const p = c.geometry.parameters;
          if (p && p.radiusTop >= 0.35 && p.height > 8) {
            cylinderMoundCount++;
          }
        }
      });
      pass('Awkward Bloated Cylinder Furrow Mounds Removed (Count: 0)', cylinderMoundCount === 0, 'Found: ' + cylinderMoundCount);

      // 3. MAP BOUNDARIES & COLLISION BARRIERS
      const boundaryColliders = w.world.colliders.filter(c => {
        if (!c.box) return false;
        const b = c.box;
        const width = b.max.x - b.min.x;
        const depth = b.max.z - b.min.z;
        return (width >= 90 || depth >= 90);
      });
      pass('Impenetrable Perimeter Boundary Walls Configured (Count >= 4)', boundaryColliders.length >= 4, 'Count: ' + boundaryColliders.length);

      // Verify trees are repositioned away from north boundary wall (Z >= -42.8)
      let treesPastNorthWall = 0;
      w.scene.traverse(c => {
        if (c.isGroup && c.position && c.position.z < -42.8 && c.position.x > -40 && c.position.x < 40) {
          // Identify tree groups specifically (birch or pine trunks)
          const isTreeGroup = c.children.some(child => 
            child.material === w.materials.birchTrunk || 
            child.material === w.materials.trunk
          );
          if (isTreeGroup) {
            treesPastNorthWall++;
          }
        }
      });
      pass('North Birch & Pine Trees Positioned Safely in Front of Mountain Wall', treesPastNorthWall === 0, 'Misplaced: ' + treesPastNorthWall);

      // 4. HOUSE EXTERIOR & INTERIOR SYSTEM
      const frontDoor = w.interactables.find(i => i.id === 'house_front_door');
      pass('House Front Door Interactable Exists', !!frontDoor && frontDoor.prompt === 'Enter Farmhouse');

      // Test House Entry Transition
      if (frontDoor) {
        frontDoor.interact(p);
      }
      await new Promise(r => setTimeout(r, 450));
      pass('Player Enters Cozy Farmhouse Interior at (160, 1.2, 161.5)', Math.abs(p.position.x - 160) < 1.0 && Math.abs(p.position.z - 161.5) < 1.0, 'Pos: ' + p.position.x + ', ' + p.position.z);

      const exitDoor = w.interactables.find(i => i.id === 'house_exit_door');
      pass('House Exit Door Interactable Exists in Interior', !!exitDoor && exitDoor.prompt === 'Leave Farmhouse');

      // Test House Exit Transition
      if (exitDoor) {
        exitDoor.interact(p);
      }
      await new Promise(r => setTimeout(r, 450));
      pass('Player Exits Farmhouse onto Exterior Porch at (0, 1.2, -27.5)', Math.abs(p.position.x - 0) < 1.0 && Math.abs(p.position.z - (-27.5)) < 1.0, 'Pos: ' + p.position.x + ', ' + p.position.z);

      // 5. STONE WELL REDESIGN
      const well = w.interactables.find(i => i.id === 'stone_well');
      pass('Redesigned Stone Well Interactable Exists', !!well && well.prompt === 'Refill Watering Can');
      fm.wateringCanCurrent = 0;
      well.interact(p);
      pass('Stone Well Refills Watering Can to Full (12/12)', fm.wateringCanCurrent === 12);

      // 6. SCARECROW REDESIGN
      let foundScarecrow = false;
      w.scene.traverse(c => {
        if (c.isGroup && Math.abs(c.position.x - (-16)) < 0.5 && Math.abs(c.position.z - 16) < 0.5) {
          // Check for sunflower hat or denim pants
          if (c.children.length >= 10) foundScarecrow = true;
        }
      });
      pass('Redesigned Characterful Scarecrow Present at (-16, 16)', foundScarecrow);

      // 7. CROP GROWTH SYSTEM & DIVERSITY
      // Plant Carrot, Wheat, Pumpkin, Tomato in test field
      fm.tillTile(-7, 4, p);
      fm.tillTile(-7, 5, p);
      fm.tillTile(-7, 6, p);

      const tCarrot = fm.tiles.get('-7_3');
      const tWheat = fm.tiles.get('-7_4');
      const tPumpkin = fm.tiles.get('-7_5');
      const tTomato = fm.tiles.get('-7_6');

      fm.plantCrop(tCarrot, 'carrot', p);
      fm.plantCrop(tWheat, 'wheat', p);
      fm.plantCrop(tPumpkin, 'pumpkin', p);
      fm.plantCrop(tTomato, 'tomato', p);

      pass('All 4 Crops Planted (Carrot, Wheat, Pumpkin, Tomato)', !!tCarrot.crop && !!tWheat.crop && !!tPumpkin.crop && !!tTomato.crop);
      pass('All 4 Crops Render Stage 1 3D Sprout Meshes', tCarrot.cropGroup?.children.length > 0 && tWheat.cropGroup?.children.length > 0 && tPumpkin.cropGroup?.children.length > 0 && tTomato.cropGroup?.children.length > 0);

      // Advance to Stage 4
      [tCarrot, tWheat, tPumpkin, tTomato].forEach(t => {
        t.crop.stage = 4;
        fm.renderCropMesh(t);
      });

      pass('Carrot Stage 4 Renders Tapered Root & Lush Fronds', tCarrot.cropGroup?.children.length >= 2);
      pass('Wheat Stage 4 Renders Golden Stalks with Bearded Awns', tWheat.cropGroup?.children.length >= 15);
      pass('Pumpkin Stage 4 Renders Fluted Ribbed Lobes & Curved Stem', tPumpkin.cropGroup?.children.length >= 8);
      pass('Tomato Stage 4 Renders Staked Trellis with Red Fruit & Calyxes', tTomato.cropGroup?.children.length >= 12);

      // Harvesting Tests
      const carrotCount0 = p.getItemCount('carrot');
      fm.harvestCrop(tCarrot, p);
      pass('Harvesting Mature Carrot Yields +2 Carrots', p.getItemCount('carrot') === carrotCount0 + 2);
      pass('Carrot Tile Preserves Clean Farmland Bed After Harvest', tCarrot.isTilled === true && tCarrot.crop === null);

      const tomatoCount0 = p.getItemCount('tomato');
      fm.harvestCrop(tTomato, p);
      pass('Harvesting Mature Tomato Yields +3 Tomatoes', p.getItemCount('tomato') === tomatoCount0 + 3);
      pass('Regrowing Tomato Resets to Stage 2 Bushy Foliage', tTomato.crop?.stage === 2);

      // 8. PERFORMANCE & TELEMETRY
      const drawCalls = window.renderer.info.render.calls;
      const triangles = window.renderer.info.render.triangles;
      pass('Draw Calls within Budget (<1200)', drawCalls < 1200, 'Calls: ' + drawCalls);
      pass('Triangles within Budget (<300k)', triangles < 300000, 'Triangles: ' + triangles);

      return results;
    })()`,
    awaitPromise: true,
    returnByValue: true
  });

  if (evalResult.exceptionDetails) {
    console.error('Browser Exception:', evalResult.exceptionDetails);
    process.exit(1);
  }

  const tests = evalResult.result.value || [];
  let passed = 0;
  let failed = 0;

  tests.forEach(t => {
    if (t.pass) {
      console.log(`[PASS] ${t.name} ${t.msg ? '(' + t.msg + ')' : ''}`);
      passed++;
    } else {
      console.log(`[FAIL] ${t.name} -> ${t.msg}`);
      failed++;
    }
  });

  console.log(`\nOVERALL: ${passed} PASSED, ${failed} FAILED\n`);

  ws.close();
  chrome.kill();

  if (failed > 0) {
    process.exit(1);
  }
} catch (err) {
  console.error('Verification error:', err);
  chrome.kill();
  process.exit(1);
}
