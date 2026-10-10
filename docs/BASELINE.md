# Meadow Valley Simulator: Project Baseline & Technical Audit

> **Document Type**: Codebase Audit & Architectural Baseline  
> **Date**: October 2026  
> **Target Version**: Meadow Valley 1.0 $\to$ 2.0  
> **Status**: Reviewed Baseline (Proposed Architecture)  

---

## 1. Executive Summary

Meadow Valley Simulator currently runs as a lightweight browser-based 3D exploration and harvesting prototype built with **Three.js (v0.170.0)** and **Vite (v6.0.0)**. It features responsive first-person movement, custom collision handling, procedural audio, procedural canvas textures, and basic crop/fruit harvesting with time-based respawning.

The project demonstrates high responsiveness in lightweight rendering and physics (zero external asset loading, sub-1-second builds, reported 60 FPS baseline). However, it lacks persistence (no save system), tool-based interactions, an in-game calendar, an economy, construction, animals, machinery, and modular state architecture.

This baseline document audits every line of the current implementation to ensure our upgrade path preserves working functionality while systematically architecting the full farming simulator.

---

## 2. Technology Stack & Dependencies

```
┌────────────────────────────────────────────────────────┐
│                   APPLICATION RUNTIME                  │
├────────────────────┬───────────────────┬───────────────┤
│ Language & Runtime │ JavaScript (ESM)  │ Node.js v24+  │
│ 3D Graphics Engine │ Three.js v0.170.0 │ WebGL 2.0     │
│ Bundler & Server   │ Vite v6.4.4       │ ESM Hot-Reload│
│ Physics & Collision│ Custom Swept AABB │ Vanilla Math  │
│ Audio Generation   │ Web Audio API     │ 100% Synth    │
│ Asset Strategy     │ Procedural Canvas │ Zero HTTP CDN │
└────────────────────┴───────────────────┴───────────────┘
```

- **Runtime Dependencies**: `three` (^0.170.0).
- **Development Dependencies**: `vite` (^6.0.0).
- **Bundle Footprint**: Production build output is ~517 kB uncompressed (~132 kB gzip), rendering it instantly playable on any modern browser.

---

## 3. Architecture & File Inventory

The codebase is organized as a flat ES-module structure in `src/`:

```
d:\Projects from me\slavey game\
├── index.html              # Shell layout, HUD elements, overlays, modal DOM
├── package.json            # Scripts & minimal Three.js/Vite config
├── vite.config.js          # Vite config with watcher ignore settings
├── start-game.bat          # Desktop launch helper script
├── README.md               # User documentation & controls guide
├── src/
│   ├── main.js             # Entry point, renderer, animation loop, DOM glue (265 lines)
│   ├── player.js           # Kinematic FPS controller, shadow proxy, backpack (557 lines)
│   ├── world.js            # Procedural level geometry, farm beds, trees, clouds (847 lines)
│   ├── collision.js        # Swept AABB solver, step-climbing, moving platforms (272 lines)
│   ├── audio.js            # Procedural Web Audio synthesizer (226 lines)
│   ├── particles.js        # Instanced BufferGeometry particle manager (176 lines)
│   └── style.css           # Glassmorphism HUD styling, backpack modal, reticle (552 lines)
└── docs/                   # (2.0 Planning Documentation Suite)
```

---

## 4. Subsystem Audit

### 4.1 Rendering & Graphics (`src/main.js`, `src/world.js`)
- **Pipeline**: `THREE.WebGLRenderer` with `antialias: true`, `powerPreference: 'high-performance'`, `PCFSoftShadowMap`, and `ACESFilmicToneMapping` (exposure `1.05`).
- **Lighting**:
  - `DirectionalLight` (`sunLight`): Position `(70, 95, 50)`, intensity `1.4`, shadow map resolution `2048x2048`, orthographic frustum `d = 65`.
  - `HemisphereLight`: Sky `0x7dc5ff`, ground `0x487d32`, intensity `0.7`.
  - `FogExp2`: Density `0.007`, color `0xa0cef5`.
- **Sky**: Inverted hemisphere dome (`radius: 320`) mapped with a 512-pixel vertical gradient canvas.
- **Clouds**: 24 composite dodecahedron cloud clusters with linear drift and wrapping at `x = ±160m`.
- **Terrain**: Single 140m × 140m box (`height: 2m`) with a 512×512 procedural mottled grass canvas texture (tiled 45×45).
- **Mountain Boundary**: 48 procedural cone peaks (28m to 42m tall) forming perimeter mountain ranges with embedded collision boxes.

### 4.2 Physics & Collision Engine (`src/collision.js`)
- **Algorithm**: Axis-separated Kinematic Swept AABB resolution.
  1. Resolves platforms delta.
  2. Resolves Y axis (gravity: `22 m/s²`, ground detection, ceiling bounds).
  3. Resolves X axis with `footOffset = 0.08m` vertical margin and step-climb up to `0.35m`.
  4. Resolves Z axis with `footOffset = 0.08m` and step-climb up to `0.35m`.
  5. Ground-stick probe (`0.12m`) prevents bounce jitter on slopes/stairs.
- **Trigger System**: Box-to-Box intersection testing for interactive volumes.

### 4.3 Player Controller & Shadow Proxy (`src/player.js`)
- **Movement Parameters**:
  - Walk Speed: `4.4 m/s`
  - Sprint Speed: `7.4 m/s` (stamina drain `22/s`, regen `28/s`)
  - Crouch Speed: `2.2 m/s` (eye height smoothly lerps from `1.65m` to `0.90m`)
  - Acceleration: `65 m/s²` on ground, `14 m/s²` in air
  - Friction: `10.0/s`
  - Jump: `7.8 m/s` with **Coyote Time** (`0.15s`) and **Jump Buffering** (`0.15s`)
- **Shadow Proxy Architecture**:
  - Character avatar (torso, head, hat, limbs, backpack) is attached to the player.
  - Rendered with `colorWrite: false, depthWrite: false`.
  - Result: 100% invisible to the first-person camera (zero polygon clipping), but fully rendered by the shadow pass to cast real-time dynamic shadows.
- **Interaction Raycast**: Central camera raycast (`far = 4.0m`) against interactable object bounding boxes.

### 4.4 Farming & Crops Prototype (`src/world.js`)
- **Current Crops**:
  - Carrot Patch: 20 plants on soil bed.
  - Pumpkin Patch: 12 pumpkins on soil bed.
  - Wheat Field: 20 wheat bundles on soil bed.
  - Fruit Trees: 12 smooth apple trees with 4 apples each.
- **Mechanics**:
  - Crops start fully grown (`ready = true`).
  - Pressing <kbd>E</kbd> harvests the crop directly into the backpack.
  - Harvested mesh scales down to `0.05` and initiates a simple countdown timer (`12s` to `16s`).
  - Timer linearly scales the mesh back to `1.0` and resets `ready = true`.
- **Limitation**: No tilling, no watering, no seeds, no soil moisture, no seasons, no quality variation.

### 4.5 Audio System (`src/audio.js`)
- **Engine**: Pure procedural Web Audio API synthesis (zero MP3/WAV files).
- **Sound Events**:
  - Grass Footstep: Bandpass-filtered noise + 65Hz sine thud.
  - Jump: Pitch-swept sine wave.
  - Land: Low-pass triangle thud (amplitude proportional to impact velocity).
  - Interaction: Resonant wooden pop (420Hz $\to$ 260Hz).
  - Ambient Nature: Procedural random bird chirps (2–4 notes, 2200Hz–2800Hz FM sweep) every 4–12s.

### 4.6 User Interface & HUD (`index.html`, `src/style.css`)
- **HUD Components**:
  - Contextual interaction reticle (`[E] Harvest Carrot`).
  - Stamina meter with exhaustion state.
  - Movement status badge (`GROUNDED`, `WALKING`, `JOGGING`, `CROUCHING`).
  - Quick Backpack Hotbar with 4 counter badges.
  - Full Backpack Inventory Modal (<kbd>B</kbd> or <kbd>Tab</kbd>).
  - Pause & Settings modal (<kbd>ESC</kbd>).
  - Toast notification queue.

---

## 5. What's Working vs. What Needs Improvement

| Feature | Current Status | Deficit / Improvement Needed |
| :--- | :--- | :--- |
| **FPS Movement & Feel** | **Exemplary** | Perfect responsiveness, coyote time, wall-sliding, head bob. |
| **Player Shadow** | **Working** | Shadow proxy works without camera clipping. |
| **Performance** | **Reported 60 FPS** | Tested on baseline environment; will be verified continuously. |
| **Tree & Farm Hitboxes**| **Working** | Tight trunk colliders, clear paths, barrier-free walking. |
| **Save / Persistence** | **MISSING** | State is lost on reload. Scheduled for Phase 2. |
| **Time & Atmosphere** | **INCOMPLETE** | Static sky and sunlight. Scheduled for Phase 2. |
| **Farming Depth** | **PRIMITIVE** | Auto-respawning plants. Scheduled for Phase 3. |
| **Economy & Trade** | **MISSING** | No currency, no store, no shipping bin, no selling. |
| **Livestock** | **MISSING** | No animals (chickens, cows, sheep) or housing. |
| **Construction** | **MISSING** | Cannot place buildings, fences, paths, or decorations. |
| **Machinery** | **MISSING** | No tractors, sprinklers, or automated processing. |
| **NPCs & Quests** | **MISSING** | No villagers, dialogue, or story goals. |
| **Visual Environment** | **NEEDS OVERHAUL** | Farmhouse missing, terrain flat, trees need richer canopy, mountain variety needed. Scheduled for Phase 1. |

---

## 6. Reported Performance Profile Baseline

*(Reported measurements from local baseline test environment, subject to verification)*
- **Draw Calls**: ~85 draw calls per frame in view frustum.
- **Geometry Count**: ~140 unique meshes; ~42,000 vertices total across terrain, mountains, trees, and crops.
- **Heap Usage**: ~68 MB reported JS Heap memory on desktop Chromium.
- **FPS**: Solid 60 FPS reported under V-Sync on standard desktop.
- **Initial Load Time**: < 300 ms on local server.

---

## 7. Baseline Preservation Mandate

During all subsequent phases of 2.0 implementation, the following foundational rules must be enforced:
1. **Never break existing movement physics**: Keep the `CollisionWorld` swept AABB solver intact.
2. **Preserve the zero-asset procedural baseline**: New features should rely on procedural geometry, shaders, and Web Audio before adding external assets.
3. **Preserve the 60 FPS performance envelope**: Utilize Three.js instancing (`InstancedMesh`) when scaling up to hundreds of crops, fences, or animal instances.
4. **Non-destructive refactoring**: Extract modular systems without ripping out working mechanics.
