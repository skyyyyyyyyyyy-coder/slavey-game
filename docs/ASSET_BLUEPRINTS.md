# Meadow Valley 3D Asset Blueprint & Replication Guide

This guide provides the exact 3D geometric specifications, materials, and code implementations for each game element in **Meadow Valley** (`D:\Projects from me\slavey game`), allowing an AI agent or 3D modeler to replicate each asset accurately.

---

## 1. Carrot Crop Asset (`carrot`)

### Visual Reference
- Isolated 3D low-poly asset featuring a tapered bright orange root partially emerging from a dark loam soil mound, topped with lush feathery foliage.

### Three.js Implementation Specifications
- **Soil Mound**:
  - `CylinderGeometry(0.35, 0.48, 0.12, 10)`
  - Material: Organic loam brown (`#321f11`), roughness `0.92`, `receiveShadow: true`.
- **Root Body**:
  - `ConeGeometry(0.12, 0.36, 8)`
  - Rotation: `Math.PI` along X axis (pointing down).
  - Material: Vibrant orange (`0xf97316`), roughness `0.5`, `flatShading: true`.
- **Foliage Tufts (6-7 Fronds)**:
  - `ConeGeometry(0.06, 0.48, 5)`
  - Radial arrangement: `rotation.y = (index / count) * Math.PI * 2`, `rotation.z = 0.28 - 0.32`.
  - Material: Fresh emerald leaf (`0x22c55e`), roughness `0.65`.

```javascript
// Standalone Three.js Carrot Creator Function
function createCarrotAsset() {
  const group = new THREE.Group();

  // 1. Loam Mound
  const moundMat = new THREE.MeshStandardMaterial({ color: 0x321f11, roughness: 0.95 });
  const mound = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.48, 0.12, 10), moundMat);
  mound.position.y = 0.06;
  group.add(mound);

  // 2. Orange Root
  const rootMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.52, flatShading: true });
  const root = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.36, 8), rootMat);
  root.rotation.x = Math.PI;
  root.position.y = 0.18;
  root.castShadow = true;
  group.add(root);

  // 3. Leafy Tops
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.7, flatShading: true });
  for (let i = 0; i < 7; i++) {
    const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.46, 5), leafMat);
    const angle = (i / 7) * Math.PI * 2;
    leaf.position.set(Math.cos(angle) * 0.08, 0.38, Math.sin(angle) * 0.08);
    leaf.rotation.z = 0.30;
    leaf.rotation.y = angle;
    leaf.castShadow = true;
    group.add(leaf);
  }
  return group;
}
```

---

## 2. Country Pumpkin Asset (`pumpkin`)

### Visual Reference
- Plump, ribbed orange pumpkin resting horizontally on a garden soil bed with curling green vines and broad circular leaves.

### Three.js Implementation Specifications
- **Gourd Body**:
  - `SphereGeometry(0.42, 12, 10)` with squashed scale `Vector3(1.15, 0.78, 1.15)`.
  - Material: Heirloom pumpkin orange (`0xea580c`), roughness `0.58`.
- **Top Stem**:
  - `CylinderGeometry(0.04, 0.05, 0.18, 6)` tilted slightly (`rotation.z = 0.15`).
  - Material: Dark vine green (`0x15803d`).
- **Runner Vines & Foliage**:
  - 4-5 wide fan leaves: `CylinderGeometry(0.18, 0.18, 0.03, 6)` distributed radially on ground.
  - Material: Lush foliage green (`0x16a34a`).

```javascript
function createPumpkinAsset() {
  const group = new THREE.Group();

  // Pumpkin Body
  const pumpMat = new THREE.MeshStandardMaterial({ color: 0xea580c, roughness: 0.58, flatShading: true });
  const pumpkin = new THREE.Mesh(new THREE.SphereGeometry(0.42, 12, 10), pumpMat);
  pumpkin.scale.set(1.15, 0.78, 1.15);
  pumpkin.position.y = 0.32;
  pumpkin.castShadow = true;
  group.add(pumpkin);

  // Stem
  const stemMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.8 });
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.18, 6), stemMat);
  stem.position.set(0.02, 0.65, 0);
  stem.rotation.z = 0.15;
  group.add(stem);

  // Ground Leaves
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.75, flatShading: true });
  for (let i = 0; i < 5; i++) {
    const leaf = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.03, 6), leafMat);
    const angle = (i / 5) * Math.PI * 2;
    leaf.position.set(Math.cos(angle) * 0.48, 0.04, Math.sin(angle) * 0.48);
    leaf.rotation.y = angle;
    group.add(leaf);
  }
  return group;
}
```

---

## 3. Apple Tree Asset (`apple_tree`)

### Visual Reference
- Mature orchard fruit tree with an organic tapering trunk, billowing cloud-like leaf canopy clusters, and bright red harvestable apples.

### Three.js Implementation Specifications
- **Trunk & Branches**:
  - Trunk: `CylinderGeometry(0.36, 0.52, 3.4, 16)` with root flare `CylinderGeometry(0.50, 0.74, 0.45, 16)`.
  - Material: Warm bark (`0x5c3d22`), roughness `0.85`.
- **Canopy Clumps**:
  - Overlapping spheres for layered shadows: Base clump (`radius: 2.35`), Mid clumps (`1.85, 1.75`), Top crest (`1.5`).
  - Smooth shading with tones: Deep green (`0x2d5a3f`), vibrant mid green (`0x3e7a48`), sun-kissed (`0x56a858`).
- **Apples**:
  - Sphere `0.22m` with dark wooden stem and tiny green leaf.
  - Material: Glossy red (`0xdc2626`), roughness `0.35`.

```javascript
function createAppleTreeAsset() {
  const tree = new THREE.Group();
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x5c3d22, roughness: 0.85 });
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x3e7a48, roughness: 0.7 });
  const appleMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.35 });

  // Trunk
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.52, 3.4, 16), woodMat);
  trunk.position.y = 1.7;
  trunk.castShadow = true;
  tree.add(trunk);

  // Canopy
  const canopy = new THREE.Group();
  canopy.position.y = 3.4;
  const c1 = new THREE.Mesh(new THREE.SphereGeometry(2.2, 16, 14), leafMat);
  c1.position.y = 1.2;
  canopy.add(c1);
  const c2 = new THREE.Mesh(new THREE.SphereGeometry(1.6, 16, 14), leafMat);
  c2.position.set(0.8, 1.6, 0.4);
  canopy.add(c2);
  tree.add(canopy);

  // Hanging Apples
  const appleOffsets = [
    { x: -1.2, y: 3.2, z: 0.8 },
    { x: 1.1, y: 3.1, z: -0.7 },
    { x: -0.7, y: 3.4, z: -1.0 }
  ];
  appleOffsets.forEach(pos => {
    const apple = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 10), appleMat);
    apple.position.set(pos.x, pos.y, pos.z);
    apple.castShadow = true;
    tree.add(apple);
  });

  return tree;
}
```

---

## 4. Stone & Dirt Country Road (`country_lane`)

### Visual Reference
- Main country thoroughfare with procedural dirt track blending and natural cobblestone edging.

### Three.js Implementation Specifications
- **Road Strip**:
  - `PlaneGeometry(width: 4.6, length: 50)` rotated `-Math.PI / 2` on X.
  - Position: Elevated slightly above grass at `y = 0.02` to avoid z-fighting.
  - Material: Procedural canvas dirt/stone texture with repeated track grooves.
- **Embedded Cobblestone Edging**:
  - Hexagonal/octagonal cylinders `CylinderGeometry(0.28, 0.36, 0.04, 6)` placed alternately along left and right margins every 3.2m.
  - Color: Weathered fieldstone (`0x78716c`), roughness `0.95`.

```javascript
function createCountryRoad(length = 40, width = 4.4) {
  const roadGroup = new THREE.Group();

  // Dirt Surface
  const dirtMat = new THREE.MeshStandardMaterial({ color: 0x8a7051, roughness: 0.9 });
  const surface = new THREE.Mesh(new THREE.PlaneGeometry(width, length), dirtMat);
  surface.rotation.x = -Math.PI / 2;
  surface.position.y = 0.02;
  surface.receiveShadow = true;
  roadGroup.add(surface);

  // Embedded Cobblestones on road edges
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0x78716c, roughness: 0.95, flatShading: true });
  for (let z = -length / 2; z <= length / 2; z += 3.0) {
    const sLeft = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.34, 0.04, 6), stoneMat);
    sLeft.position.set(-width / 2 + 0.15, 0.025, z);
    roadGroup.add(sLeft);

    const sRight = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.34, 0.04, 6), stoneMat);
    sRight.position.set(width / 2 - 0.15, 0.025, z);
    roadGroup.add(sRight);
  }

  return roadGroup;
}
```

---

## 5. Summary Mapping to Game Files

| Asset | Current File Location | Function Name |
| :--- | :--- | :--- |
| **Carrot Crop** | `src/farming.js` & `src/world.js` | `renderCropMesh` / `createCarrotCrop` |
| **Country Pumpkin** | `src/farming.js` & `src/world.js` | `renderCropMesh` / `createPumpkinCrop` |
| **Apple Tree** | `src/world.js` | `buildNaturalEcosystems` (`orchardLocations`) |
| **Country Road** | `src/world.js` | `buildFarmlandTopography` (`mainLane`, `cobbleMat`) |
