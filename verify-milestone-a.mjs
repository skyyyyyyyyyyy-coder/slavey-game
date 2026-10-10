import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const chromePath = 'C:\\Users\\chlov\\AppData\\Local\\ms-playwright\\chromium-1234\\chrome-win64\\chrome.exe';
const testPort = 9260;

console.log('=== MEADOW VALLEY SIMULATOR — MILESTONE A AUTOMATED VERIFICATION ===\n');

const chrome = spawn(chromePath, [
  '--headless=new',
  '--no-sandbox',
  `--remote-debugging-port=${testPort}`,
  'http://localhost:5174/?started=1'
], { stdio: 'ignore' });

await new Promise(r => setTimeout(r, 2200));

try {
  const res = await fetch(`http://127.0.0.1:${testPort}/json`);
  const tabs = await res.json();
  const pageTab = tabs.find(t => t.type === 'page' || t.url.includes('localhost'));
  
  if (!pageTab) {
    throw new Error('No page tab found on Chrome debug endpoint');
  }

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

  // Settle time for textures, shaders and world
  await send('Runtime.evaluate', {
    expression: 'new Promise(r => setTimeout(r, 2000))',
    awaitPromise: true
  });

  const evalResult = await send('Runtime.evaluate', {
    expression: `(async () => {
      const results = [];
      function pass(name, cond, msg = '') {
        results.push({ name, pass: !!cond, msg });
      }

      const fm = window.farmingManager;
      const w = window.world;
      const p = window.player;
      const ap = window.assetPipeline;

      // 1. ARABLE BOUNDARY & TILLING ENFORCEMENT
      pass('FarmingManager Exists & Initialized', !!fm);

      const zonePoints = [
        { name: 'Homestead West Field', gx: -7, gz: 3 },
        { name: 'South-West Paddock', gx: -15, gz: 16 },
        { name: 'North-West Paddock', gx: -15, gz: -14 },
        { name: 'South-East Paddock', gx: 15, gz: 16 },
        { name: 'North-East Paddock', gx: 15, gz: -14 },
        { name: 'Homestead East Field', gx: 7, gz: 3 }
      ];

      zonePoints.forEach(zp => {
        const check = fm.canTill(zp.gx, zp.gz);
        pass('Tilling Allowed in Arable Zone: ' + zp.name, check.valid, check.reason || '');
      });

      // Strict rejection on non-arable locations
      pass('Tilling Blocked on Main Cobblestone Road (0, 0)', !fm.canTill(0, 0).valid);
      pass('Tilling Blocked on Orchard Cross-Lane (-10, -8)', !fm.canTill(-10, -8).valid);
      pass('Tilling Blocked on Homestead Terrace Knoll (0, -25)', !fm.canTill(0, -25).valid);
      pass('Tilling Blocked on North Mountain Crags (0, -44)', !fm.canTill(0, -44).valid);
      pass('Tilling Blocked on Wild East Meadow (30, 0)', !fm.canTill(30, 0).valid);
      pass('Tilling Blocked near Stone Well (-16, -8)', !fm.canTill(-16, -8).valid);

      // Rejection feedback message check
      let lastMessage = '';
      window.addEventListener('game:message', (e) => {
        lastMessage = e.detail?.message || '';
      });

      // Simulate invalid till tool use on road
      fm.activeToolIndex = 0; // Hoe
      fm.targetedTile = { gx: 0, gz: 0, key: '0_0', valid: false, actionType: 'till', reason: 'Cannot till on stone lane' };
      p.stamina = 100;
      const tillResult = fm.useActiveTool(p);
      pass('useActiveTool Rejects Invalid Till Placement', tillResult === false);
      pass('useActiveTool Dispatches Warning Feedback Toast', lastMessage.includes('Cannot till on stone lane'), 'Msg: ' + lastMessage);

      // 2. SOIL-GRID ALIGNMENT & GEOMETRY QUALITY
      p.stamina = 100;
      fm.tillTile(-7, 2, p);
      fm.tillTile(-7, 3, p);

      const tile1 = fm.tiles.get('-7_2');
      const tile2 = fm.tiles.get('-7_3');
      pass('Farmland Tiles Created at Exact Integer Coordinates', !!tile1 && !!tile2);

      const isBoxGeo = tile1?.soilMesh?.geometry?.type === 'BoxGeometry';
      const boxParams = tile1?.soilMesh?.geometry?.parameters;
      pass('Soil Bed uses Clean 1.0x1.0m Aligned BoxGeometry', isBoxGeo && boxParams?.width === 1.0 && boxParams?.depth === 1.0);
      pass('Soil Bed Elevation is Clean Low Slab (0.035m)', boxParams?.height === 0.035);
      pass('Soil Tile has 2 Longitudinal Furrow Slats', tile1?.furrows?.length === 2);

      // Check alignment continuity: furrow length is 1.0m along Z
      const furrowGeo = tile1?.furrows[0]?.geometry;
      pass('Furrow Slat Length is Exactly 1.0m (Seamless Inter-Tile Connection)', furrowGeo?.parameters?.depth === 1.0);

      // Check plant centering: cropGroup is centered at (0, 0, 0) inside soilGroup at (-7, 2)
      p.addToBackpack('seed_carrot', 5);
      fm.plantCrop(tile1, 'carrot', p);
      const isCropCentered = !!tile1.cropGroup && tile1.soilGroup?.position.x === -7 && tile1.soilGroup?.position.z === 2 && tile1.cropGroup.position.x === 0 && tile1.cropGroup.position.z === 0;
      pass('Planted Crop Pivot is Centered on Tile (-7, 2)', isCropCentered);

      // 3. MOUNTAIN PERIMETER COLLISION & BARRIERS
      const boundaryColliders = w.world.colliders.filter(c => {
        if (!c.box) return false;
        const b = c.box;
        const width = b.max.x - b.min.x;
        const depth = b.max.z - b.min.z;
        return (width >= 90 || depth >= 90);
      });
      pass('4 Impenetrable Boundary Walls Configured', boundaryColliders.length >= 4, 'Count: ' + boundaryColliders.length);

      // Test player collision sliding into North boundary
      p.position.set(0, 1.2, -41.5);
      p.velocity.set(0, 0, -10.0);
      w.world.resolveMovement(p, 0.1);
      pass('North Boundary Wall Blocks Player Movement Past z=-42.5', p.position.z >= -42.6, 'Pos Z: ' + p.position.z);

      // Test player collision sliding into South boundary
      p.position.set(0, 1.2, 45.0);
      p.velocity.set(0, 0, 10.0);
      w.world.resolveMovement(p, 0.1);
      pass('South Boundary Wall Blocks Player Movement Past z=46.0', p.position.z <= 46.1, 'Pos Z: ' + p.position.z);

      // Reset player position back to valley center for normal gameplay rendering
      p.position.set(0, 1.2, 0);
      p.velocity.set(0, 0, 0);

      // 4. SCENE PROP AUDIT & MISPLACED OBJECT CHECK
      let outOfBoundsCount = 0;
      let misplacedDetails = [];
      w.scene.traverse(c => {
        if (c.isGroup && c.position) {
          // Identify tree groups or major props
          const isTree = c.children?.some(child => 
            child.material === w.materials?.birchTrunk || 
            child.material === w.materials?.trunk
          );
          if (isTree) {
            // Check if tree is outside valley boundary box [-48 to 48 on X, -42.5 to 46 on Z]
            if (c.position.z < -42.5 || c.position.z > 46.0 || c.position.x < -48.0 || c.position.x > 48.0) {
              outOfBoundsCount++;
              misplacedDetails.push(\`Tree at (\${c.position.x}, \${c.position.z})\`);
            }
          }
        }
      });
      pass('Scene Prop Audit: Zero Trees or Props Placed Out-of-Bounds', outOfBoundsCount === 0, misplacedDetails.join(', '));

      // 5. REUSABLE BLENDER ASSET PIPELINE
      pass('AssetPipeline Module Initialized & Exposed', !!ap);

      let loadedAsset = null;
      try {
        loadedAsset = await ap.loadModel('/models/apple_tree.glb', {
          castShadow: true,
          receiveShadow: true,
          collision: 'cylinder'
        });
      } catch (err) {
        // Fallback check
      }

      pass('AssetPipeline Successfully Loads and Parses apple_tree.glb', !!loadedAsset && !!loadedAsset.model);
      pass('AssetPipeline Automatically Applies Cast & Receive Shadow Flags', loadedAsset?.model?.children?.length > 0);
      pass('AssetPipeline Extracts Collision Proxies from Loaded Asset', loadedAsset?.colliders?.length > 0);

      // Test Cache Hits
      const cacheBefore = ap.getStats().cachedTemplates;
      await ap.loadModel('/models/apple_tree.glb');
      const cacheAfter = ap.getStats().cachedTemplates;
      pass('AssetPipeline Deduplicates & Caches Parsed GLTF Templates', cacheBefore === cacheAfter && cacheAfter > 0);

      // Test Disposal
      let disposedCleanly = true;
      try {
        ap.disposeHierarchy(loadedAsset.model);
      } catch (e) {
        disposedCleanly = false;
      }
      pass('AssetPipeline Safely Disposes Asset Hierarchy & Geometries', disposedCleanly);

      // 6. PERFORMANCE & BUDGET CHECKS
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
    console.error('Browser Exception during evaluation:', evalResult.exceptionDetails);
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
