// Spatial audit and layout generator for Meadow Valley trees
const orchardTrees = [
  // North-East Orchard Row (East of NE Pumpkin Paddock x=23, North of East Lane z=-8)
  { x: 26.0, z: -16.0 }, { x: 31.2, z: -15.2 }, { x: 36.2, z: -16.2 },
  // Central-East Orchard Row (South of East Lane z=-8, clear of Picnic Table at 26,-1)
  { x: 25.8, z: -4.2 },  { x: 31.2, z: -3.6 },  { x: 36.5, z: -4.4 },
  // South-East Orchard Row (North of SE Paddock z=11, East of NE/SE Paddocks x=23)
  { x: 25.8, z: 5.8 },   { x: 31.2, z: 5.2 },   { x: 36.4, z: 6.0 },
  // West Meadow Heritage Fruit Trees (West of NW/SW Paddocks x=-23)
  { x: -27.5, z: -15.0 }, { x: -28.5, z: -3.8 }, { x: -27.8, z: 7.2 }
];

// Proposed curated Spruce positions (framing perimeter mountain woodland inside boundary walls)
const candidateSpruce = [
  // North Mountain Forest Belt (Behind & flanking farmhouse knoll with safe breathing room)
  { x: -34.0, z: -37.5, scale: 1.05 },
  { x: -27.5, z: -38.5, scale: 1.10 },
  { x: -20.5, z: -38.0, scale: 0.95 },
  { x: 20.5,  z: -38.0, scale: 0.95 },
  { x: 27.5,  z: -38.5, scale: 1.10 },
  { x: 34.0,  z: -37.5, scale: 1.05 },

  // East Foothill Forest (flanking east valley ridge)
  { x: 39.5, z: -30.0, scale: 1.00 },
  { x: 40.5, z: -21.0, scale: 1.08 },
  { x: 40.0, z: -11.5, scale: 0.95 },
  { x: 40.5, z: 0.5,   scale: 1.05 },
  { x: 39.5, z: 11.5,  scale: 0.92 },
  { x: 40.5, z: 22.5,  scale: 1.05 },
  { x: 39.0, z: 32.5,  scale: 1.00 },

  // South Valley Entrance Woodlands (framing south meadow approach)
  { x: -31.0, z: 38.5, scale: 1.05 },
  { x: -23.0, z: 39.5, scale: 1.10 },
  { x: -14.0, z: 38.5, scale: 0.95 },
  { x: 14.0,  z: 38.5, scale: 0.95 },
  { x: 23.0,  z: 39.5, scale: 1.10 },
  { x: 31.0,  z: 38.5, scale: 1.05 },

  // West Ridge Forest (flanking west ridge)
  { x: -39.5, z: -29.0, scale: 1.00 },
  { x: -40.5, z: -19.5, scale: 1.05 },
  { x: -39.5, z: -11.5, scale: 0.95 },
  { x: -40.5, z: 1.5,   scale: 1.05 },
  { x: -39.5, z: 14.0,  scale: 0.95 },
  { x: -40.5, z: 25.0,  scale: 1.10 },
  { x: -39.0, z: 34.5,  scale: 1.00 }
];

// Proposed curated Birch positions (picturesque copses naturally interspersed)
const candidateBirch = [
  // Flanking chalet knoll (with safe clearance from terrace retaining wall)
  { x: -18.0, z: -26.5, scale: 1.05 },
  { x: 18.0,  z: -26.5, scale: 1.05 },
  { x: -18.5, z: -34.5, scale: 0.95 },
  { x: 18.5,  z: -34.5, scale: 0.95 },

  // Shaded copse near stone well plaza (clear of well radius 2.6m and road)
  { x: -23.5, z: -2.0,  scale: 1.00 },
  { x: -26.0, z: 3.5,   scale: 0.95 },

  // Meadow groves (framing vistas)
  { x: -18.5, z: 27.5,  scale: 1.00 },
  { x: 18.5,  z: 27.5,  scale: 1.00 },
  { x: 35.5,  z: -23.5, scale: 1.05 },
  { x: 35.5,  z: 15.5,  scale: 0.95 }
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
