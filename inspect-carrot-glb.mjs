import fs from 'fs';

// Quick inspect GLB chunk 0 (JSON)
const buf = fs.readFileSync('public/models/crop_carrot.glb');
const magic = buf.readUInt32LE(0);
const version = buf.readUInt32LE(4);
const length = buf.readUInt32LE(8);
const jsonLen = buf.readUInt32LE(12);
const jsonType = buf.readUInt32LE(16);

if (jsonType === 0x4E4F534A) {
  const jsonStr = buf.toString('utf8', 20, 20 + jsonLen);
  const gltf = JSON.parse(jsonStr);
  console.log('=== GLTF INSPECTION: crop_carrot.glb ===');
  console.log('Nodes count:', gltf.nodes?.length);
  gltf.nodes?.forEach((n, idx) => {
    console.log(`Node ${idx}: "${n.name}", mesh: ${n.mesh !== undefined ? n.mesh : 'none'}, children: ${JSON.stringify(n.children || [])}`);
  });
  console.log('Meshes count:', gltf.meshes?.length);
  gltf.meshes?.forEach((m, idx) => {
    console.log(`Mesh ${idx}: "${m.name}", primitives: ${m.primitives?.length}`);
    m.primitives?.forEach((p, pIdx) => {
      console.log(`  Prim ${pIdx}: material ${p.material}, attributes: ${Object.keys(p.attributes).join(', ')}`);
    });
  });
  console.log('Materials count:', gltf.materials?.length);
  gltf.materials?.forEach((m, idx) => {
    console.log(`Material ${idx}: "${m.name}", doubleSided: ${m.doubleSided}`);
  });
} else {
  console.log('Not standard JSON chunk');
}
