# Meadow Valley Simulator — Game Progress & Reconstruction Log

## Current Intent & Constraints
- **Objective**: Transform Meadow Valley Simulator into a premium, interactive, stylized-realistic 3D farming world using Blender MCP and Three.js skills.
- **Constraints**:
  - Sequential milestone execution: Milestone A MUST complete and be approved before starting Milestone B.
  - Interactive world: Not just decorative 3D models; all key structures, doors, beds, wells, gates, and crops must have tactile gameplay interactions.
  - Preserve core engines: Three.js r128+, Vite dev server, player FPS controller, TimeManager day/night cycles, SaveManager (Schema v2), stamina system.
  - 60+ FPS desktop performance target, <1200 draw calls, <300k triangles.
  - No runtime Blender dependency: assets exported to optimized GLB files with `.blend` source preserved.

---

## Technical Stack & Installed Skills
- **Three.js Game Director**: Architectural coordination, quality bar, and verification oversight.
- **Three.js Gameplay Systems**: Core loops, interaction raycasting, deterministic updates, collisions.
- **Three.js AAA Graphics Builder**: Shading, lighting, model authoring, visual scorecard.
- **Three.js Debug Profiler**: Draw calls, triangles, memory, FPS, collision leak detection.
- **Three.js QA Release**: Headless automated test harnesses, dual-resolution captures (1920x1080 & 1440x900).
- **Blender MCP**: Live connection to Blender 4.x via `execute_blender_code`, `look`, and `get_scene_info`.

---

## Architectural Decisions
1. **Asset Pipeline**:
   - Reusable asset management module (`src/assetPipeline.js`) providing asynchronous GLB loading, geometry/material caching, automatic shadow tagging, bounding-box collision proxy extraction, and memory disposal.
   - Models stored in `public/models/` with matching `.blend` source files.
2. **Farming Grid & Coordinate System**:
   - Discrete 1.0m x 1.0m integer grid (`gx`, `gz`).
   - Soil beds: flat 1.0x1.0m slabs with seamless longitudinal furrows, avoiding raised puffy mounds.
   - Arable Zones: Strict bounding boxes enforcing farmable meadow zones and forbidding tilling on paths, knolls, mountains, buildings, or water.
3. **Collision & Map Boundaries**:
   - Separate visual mountains from physical barrier boxes.
   - Sealed 4-sided perimeter walls ($Z=-43, 49; X=\pm 51$) and 4 diagonal corner wedges.
   - Zero gameplay props allowed outside or embedded in mountain barriers.
4. **House & Interior Architecture**:
   - Interactive front door with stateful swing animation and seamless interior transition.
   - Farmhouse interior equipped with interactive bed (sleep to 06:00 sunrise), stone hearth fireplace, toggleable lantern lighting, and storage trunk.
5. **Crop Lifecycle**:
   - 4 crops: Carrot, Wheat, Pumpkin, Tomato.
   - 4 distinct visual stages per crop: Seedling, Growing, Maturing, Harvest-Ready.
   - Driven strictly by TimeManager day rollover, moisture requirement, and stamina expenditure.

---

## Completed Milestones & Checkpoints
- **Baseline Checkpoint (Commit `7e1d5d6`)**:
  - Arable zones defined and enforced in `src/farming.js`.
  - Clean 1.0x1.0m furrowed soil beds implemented.
  - Impenetrable perimeter boundary walls added in `src/world.js`.
  - Full 12-tree Blender orchard upgrade active in `public/models/apple_tree.glb` (Commit `7d706f5`).
- **Milestone A — Gameplay & Geometry Foundation (COMPLETED & VERIFIED)**:
  - Farming Boundaries strictly enforced across 6 Arable Zones (`canTill`, `waterTile`, `plantCrop`).
  - Tactile visual and audible feedback toasts on invalid tilling (e.g. `⚠️ Cannot till on stone lane`, `⚠️ Unsuitable soil`).
  - Clean 1.0x1.0m soil-grid alignment with continuous longitudinal furrow slats along Z and centered crop pivots.
  - Impenetrable 30m perimeter boundary walls sealing North ($Z=-44.5$), South ($Z=48.0$), West ($X=-50.0$), East ($X=50.0$), and 4 diagonal corner wedges.
  - Zero out-of-bounds scene objects: all pine and birch trees positioned cleanly in front of boundary colliders.
  - Reusable `AssetPipeline` (`src/assetPipeline.js`) implemented with asynchronous caching, shadow automation, collision proxy extraction, and memory disposal.
  - Verification test suite `verify-milestone-a.mjs`: 33/33 PASS (100%), 916 draw calls, 61k triangles, 101 FPS.
  - Regression test suites: `test-phase3.mjs` (58/58 PASS), `verify-phase3-repair.mjs` (36/36 PASS). Total 127/127 passing tests across suites.
  - 8 dual-resolution screenshots captured (1920x1080 and 1440x900).

---

## Active Status: Waiting for User Review & Sign-Off
- **Immediate Next Step**: Stop and await user review and approval of Milestone A before beginning Milestone B (Farmhouse & Interior).
