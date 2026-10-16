// Spatial audit and layout generator for Meadow Valley trees
const orchardTrees = [
  { x: 19.5, z: -17.8 }, { x: 25.8, z: -16.5 }, { x: 32.2, z: -17.2 },
  { x: 20.2, z: -6.2 },  { x: 26.5, z: -5.0 },  { x: 33.0, z: -6.5 },
  { x: 19.8, z: 6.8 },   { x: 26.2, z: 5.5 },   { x: 32.5, z: 6.2 },
  { x: -27.5, z: -15.5 }, { x: -28.8, z: -4.2 }, { x: -28.0, z: 8.5 }
];

// Proposed curated Spruce positions (framing perimeter mountain woodland)
const candidateSpruce = [
  // North Mountain Forest Belt (Behind & flanking farmhouse knoll with safe breathing room)
  { x: -32.0, z: -41.0, scale: 1.05 },
  { x: -25.0, z: -41.5, scale: 1.10 },
  { x: -18.0, z: -42.0, scale: 0.95 },
  { x: 0.0,   z: -42.5, scale: 1.15 },
  { x: 18.0,  z: -42.0, scale: 0.95 },
  { x: 25.0,  z: -41.5, scale: 1.10 },
  { x: 32.0,  z: -41.0, scale: 1.05 },

  // East Foothill Forest (flanking east valley ridge)
  { x: 44.0, z: -32.0, scale: 1.00 },
  { x: 45.0, z: -24.0, scale: 1.10 },
  { x: 44.0, z: -14.0, scale: 0.95 },
  { x: 45.0, z: 0.0,   scale: 1.05 },
  { x: 44.0, z: 12.0,  scale: 0.90 },
  { x: 45.0, z: 24.0,  scale: 1.05 },
  { x: 44.0, z: 35.0,  scale: 1.00 },

  // South Valley Entrance Woodlands (framing south meadow approach)
  { x: -32.0, z: 43.5, scale: 1.05 },
  { x: -24.0, z: 44.0, scale: 1.10 },
  { x: -15.0, z: 43.5, scale: 0.95 },
  { x: 15.0,  z: 43.5, scale: 0.95 },
  { x: 24.0,  z: 44.0, scale: 1.10 },
  { x: 32.0,  z: 43.5, scale: 1.05 },

  // West Ridge Forest (flanking west ridge)
  { x: -44.0, z: -30.0, scale: 1.00 },
  { x: -45.0, z: -20.0, scale: 1.05 },
  { x: -44.0, z: -8.0,  scale: 0.95 },
  { x: -45.0, z: 6.0,   scale: 1.05 },
  { x: -44.0, z: 18.0,  scale: 0.95 },
  { x: -45.0, z: 29.0,  scale: 1.10 },
  { x: -44.0, z: 39.0,  scale: 1.00 }
];

// Proposed curated Birch positions (picturesque copses naturally interspersed)
const candidateBirch = [
  // Flanking chalet knoll (with >7m clearance from house walls and porch)
  { x: -16.5, z: -26.0, scale: 1.05 },
  { x: 16.5,  z: -26.0, scale: 1.05 },
  { x: -14.0, z: -35.0, scale: 0.95 },
  { x: 14.0,  z: -35.0, scale: 0.95 },

  // Shaded copse near stone well plaza (clear of well radius 2.6m and road)
  { x: -22.5, z: -3.0,  scale: 1.00 },
  { x: -24.0, z: 2.0,   scale: 0.95 },

  // Meadow groves (framing vistas)
  { x: -18.5, z: 27.0,  scale: 1.00 },
  { x: 18.5,  z: 27.0,  scale: 1.00 },
  { x: 36.0,  z: -22.0, scale: 1.05 },
  { x: 36.0,  z: 14.0,  scale: 0.95 }
];

// Clearance rules
function checkClearance(tree, type) {
  // 1. Farmhouse bounds: house at (0, -34), w=10.6, d=7.8, porch to z=-26.3
  const inHouseZone = Math.abs(tree.x) < 7.5 && tree.z > -40.0 && tree.z < -24.5;
  if (inHouseZone) return `Too close to farmhouse: (${tree.x}, ${tree.z})`;

  // 2. Main Avenue: X in [-2.6, 2.6], Z in [-25, 34]
  if (Math.abs(tree.x) < 3.2 && tree.z > -26 && tree.z < 35) {
    return `Too close to Main Avenue: (${tree.x}, ${tree.z})`;
  }

  // 3. Cross-Lanes: Z approx -8, X in [-36, 38]
  if (Math.abs(tree.z - (-8)) < 3.0 && Math.abs(tree.x) < 38) {
    return `Too close to Cross-Lane: (${tree.x}, ${tree.z})`;
  }

  // 4. Well Plaza: at (-16, -8) radius 3.5m
  const distToWell = Math.hypot(tree.x - (-16), tree.z - (-8));
  if (distToWell < 3.8) return `Too close to Well: (${tree.x}, ${tree.z})`;

  // 5. Arable Zones:
  // Zone 1: [-10, -4] x [-2, 10]
  if (tree.x >= -10.5 && tree.x <= -3.5 && tree.z >= -2.5 && tree.z <= 10.5) return `Inside Zone 1: (${tree.x}, ${tree.z})`;
  // Zone 2: [-22, -10] x [11, 21]
  if (tree.x >= -22.5 && tree.x <= -9.5 && tree.z >= 10.5 && tree.z <= 21.5) return `Inside Zone 2: (${tree.x}, ${tree.z})`;
  // Zone 3: [-22, -10] x [-19, -9]
  if (tree.x >= -22.5 && tree.x <= -9.5 && tree.z >= -19.5 && tree.z <= -8.5) return `Inside Zone 3: (${tree.x}, ${tree.z})`;
  // Zone 4: [10, 22] x [11, 21]
  if (tree.x >= 9.5 && tree.x <= 22.5 && tree.z >= 10.5 && tree.z <= 21.5) return `Inside Zone 4: (${tree.x}, ${tree.z})`;
  // Zone 5: [10, 22] x [-19, -9]
  if (tree.x >= 9.5 && tree.x <= 22.5 && tree.z >= -19.5 && tree.z <= -8.5) return `Inside Zone 5: (${tree.x}, ${tree.z})`;

  return null;
}

// Inter-tree distance check
const allTrees = [
  ...orchardTrees.map(t => ({ ...t, type: 'apple', r: 2.4 })),
  ...candidateSpruce.map(t => ({ ...t, type: 'spruce', r: 2.6 * (t.scale || 1) })),
  ...candidateBirch.map(t => ({ ...t, type: 'birch', r: 1.8 * (t.scale || 1) }))
];

let overlaps = 0;
for (let i = 0; i < allTrees.length; i++) {
  const tA = allTrees[i];
  const clr = checkClearance(tA, tA.type);
  if (clr) console.warn(`[CLEARANCE ISSUE]`, clr);

  for (let j = i + 1; j < allTrees.length; j++) {
    const tB = allTrees[j];
    const dist = Math.hypot(tA.x - tB.x, tA.z - tB.z);
    // Minimum trunk separation: sum of canopy radii * 0.90 to prevent crown interpenetration
    const minDist = (tA.r + tB.r) * 0.90;
    if (dist < minDist) {
      console.warn(`[OVERLAP] Tree ${i} (${tA.type} at ${tA.x}, ${tA.z}) and Tree ${j} (${tB.type} at ${tB.x}, ${tB.z}) distance: ${dist.toFixed(2)}m < min ${minDist.toFixed(2)}m`);
      overlaps++;
    }
  }
}

console.log(`Audit complete: ${allTrees.length} total trees audited. Overlaps found: ${overlaps}`);
