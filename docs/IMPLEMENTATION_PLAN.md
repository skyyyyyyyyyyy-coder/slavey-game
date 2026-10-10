# Meadow Valley Simulator 2.0: Phased Implementation Plan

> **Document Type**: Phased Implementation Roadmap & Component Migration Matrix  
> **Status**: Proposed Implementation Roadmap (Reviewed Baseline)  
> **Approach**: Non-destructive, incremental feature integration preserving 100% of working baseline  

---

## 1. Upgrade Philosophy & Preservation Strategy

To evolve **Meadow Valley Simulator** into a premium 3D farming simulator without regressions or breaking changes:

1. **Continuous Playability**: The game must remain completely playable and buildable with `npm run build` after every single phase.
2. **Preserve Tested Mechanics**: The existing responsive kinematic FPS movement, swept AABB collision solver, coyote time, jump buffering, stamina, and camera-invisible shadow proxy avatar are protected and preserved.
3. **Decoupled Architecture**: Systems are introduced modularly without premature code disruption. Modules will evolve under `src/core/`, `src/farming/`, `src/economy/`, `src/animals/`, and `src/ui/`.
4. **Zero Heavy Engine Dependencies**: Maintain our fast, lightweight stack (Three.js + Vite + Web Audio API). No external bloatware or unvetted libraries.

---

## 2. Visual Direction & Aesthetic Recommendations

To achieve a **beautiful, cozy, stylized low-poly 3D world**:

```
┌────────────────────────────────────────────────────────────────────────┐
│                      VISUAL DIRECTION SPECIFICATION                    │
├────────────────────┬───────────────────────────────────────────────────┤
│ Art Style          │ Clean Stylized Low-Poly with Smooth Vertex Normals│
│ Color Palette      │ Warm, vibrant natural tones (Spring Green #3d9435,│
│                    │ Earth Brown #452b17, Sky Blue #42a5f5, Warm Gold) │
│ Lighting & Shadows │ Warm directional daylight with balanced bounce;   │
│                    │ PCF soft shadow maps; sky-blue ambient fill light │
│ Environment Shading│ Procedural canvas textures with natural variation │
│ Foliage Movement   │ Gentle sinusoidal vertex/pivot sway for crops &   │
│                    │ tree leaf canopies simulating meadow breeze       │
│ Farmhouse          │ Cozy timber log home with shingle roof & chimney  │
│ Vegetation Variety │ Grass tufts, wildflowers, lush bushes, farm props │
└────────────────────┴───────────────────────────────────────────────────┘
```

---

## 3. Phased Implementation Roadmap

```
┌──────────────────────────────────────────────────────────────────────────┐
│ PHASE 1: VISUAL VERTICAL SLICE (Central Farm & Surroundings)             │
│ • Cozy low-poly Farmhouse (timber porch, slate roof, stone chimney)      │
│ • Overhauled crop fields & furrow arrangements (organic earthy rows)     │
│ • Attractive curved dirt paths & natural ground transitions              │
│ • Tree foliage overhaul (vibrant warm greens, multi-lobed smooth canopies│
│ • Natural vegetation: 3D grass tufts, flowers, bushes, farm crates/props │
│ • Varied mountain boundary skyline (distinct ridge profiles & foothill)  │
│ • Warm, balanced daylighting, sky gradient & lightweight wind sway       │
└────────────────────────────────────┬─────────────────────────────────────┘
                                     ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ PHASE 2: FOUNDATION, TIME ENGINE & PERSISTENCE (The Backbone)           │
│ • TimeManager (24-min real day = 60 in-game sec per real sec; sun arc)   │
│ • SaveManager (LocalStorage JSON schema with auto-save & migration)      │
│ • Decoupled EventHub event bus                                           │
└────────────────────────────────────┬─────────────────────────────────────┘
                                     ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ PHASE 3: TACTILE FARMING & ACTIVE TOOL BELT (Core Gameplay)              │
│ • ToolManager & Diegetic Hotbar (Keys 1-8: Hoe, Can, Seeds, Sickle)      │
│ • Dynamic 1x1m Soil Grid with Tilling & Moisture states                  │
│ • 4-stage visual growth pipeline for Carrots, Pumpkins, Wheat, Tomatoes  │
│ • Fluid splash particles and dirt crunch procedural sound effects        │
└────────────────────────────────────┬─────────────────────────────────────┘
                                     ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ PHASE 4: ECONOMY, SHIPPING BIN & STORE (Progression Loop)                │
│ • Physical Shipping Bin with evening item deposit                        │
│ • 06:00 Dawn Daily Ledger modal with profit sound and coin deposit       │
│ • Sam's General Store (seed packets, saplings, feed)                     │
│ • Goran's Blacksmith (tool upgrades: Starter -> Copper -> Iron)          │
└────────────────────────────────────┬─────────────────────────────────────┘
                                     ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ PHASE 5: LIVESTOCK & ANIMAL HUSBANDRY (Living Farm)                      │
│ • Chicken Coop with animated low-poly Chickens (clucking, eggs)          │
│ • Pasture Barn with Dairy Cows (grazing, petting, milk bucket yield)     │
│ • Daily care mechanics (petting affection hearts, hay feeding)           │
└────────────────────────────────────┬─────────────────────────────────────┘
                                     ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ PHASE 6: FARM CONSTRUCTION & CUSTOMIZATION (Creative Sandbox)            │
│ • 1x1m Grid-snapping building mode (Hammer tool / 'H' key; Tab=Backpack) │
│ • Split-rail fences, functional latch gates, stone and timber paths      │
│ • Dynamic collider registration into CollisionWorld                      │
└────────────────────────────────────┬─────────────────────────────────────┘
                                     ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ PHASE 7: AUTOMATION & FARM MACHINERY (Late-Game Scale)                   │
│ • Sprinklers (Basic 4-cross, Quality 8-tile, Pressure 24-tile)           │
│ • Automated 06:00 morning watering grid                                  │
│ • Drivable Tractor with 3-row Tiller and Harvester attachments           │
└────────────────────────────────────┬─────────────────────────────────────┘
                                     ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ PHASE 8: NPCS, QUESTS & TOWN LIVING (Community & Story)                  │
│ • Villagers (Mayor Barnaby, Lin the Botanist, Goran the Smith, Mae)      │
│ • Dialogue system, friendship hearts, and daily Notice Board contracts   │
│ • Seasonal farming festivals and final agricultural master license       │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Component Modification & File Impact Matrix

| File Path | Current Role | Planned Modification | Risk Level | Rollback / Preservation Strategy |
| :--- | :--- | :--- | :--- | :--- |
| `src/main.js` | Monolithic loop & DOM glue | Integrate `TimeManager`, `SaveManager`, and pass clean updates | Low | Retain existing Three.js renderer, shadow settings, and resize hooks. |
| `src/player.js` | Controller, shadow proxy, backpack | Integrate `ToolManager` and connect active tool state to raycast | Low | Keep kinematic swept physics, shadow proxy material, and stamina intact. |
| `src/collision.js` | Swept AABB collision solver | Add `removeBoxCollider()` method for demolished buildings | Minimal | Core solver remains 100% untouched; only adds dynamic array management. |
| `src/world.js` | Monolithic world, farms, trees | Extract crop and tree logic into modular managers; retain terrain & mountains | Medium | Move crop logic to `src/farming/`, leaving `world.js` responsible only for terrain & perimeter. |
| `src/audio.js` | Procedural Web Audio synth | Add tool whooshes, watering splashes, cash registers, cow/chicken calls | Minimal | Purely additive; existing footstep and bird sounds preserved. |
| `src/particles.js`| Instanced points system | Add water droplet emitter and soil dust puffs | Minimal | Purely additive methods on existing `ParticleManager`. |
| `src/style.css` | HUD styling & backpack modal | Add tool hotbar, clock/weather widget, and daily ledger screens | Low | Retain dark glassmorphic neutral theme; extend with new UI modules. |
| `index.html` | Shell layout & overlays | Add clock widget, tool belt slots, and morning ledger modal container | Low | Additive HTML structure; existing canvas container unchanged. |

### New Files to Create

1. `src/core/events.js`: Central typed event bus (`EventHub`).
2. `src/core/time.js`: `TimeManager` handling 24-minute day/night cycle, sun rotation, and calendar.
3. `src/core/save.js`: `SaveManager` handling JSON serialization, LocalStorage read/write, and auto-save.
4. `src/farming/soil.js`: `SoilGridManager` handling 1x1m tilled tiles, soil moisture, and tilling.
5. `src/farming/crops.js`: `CropManager` handling 4-stage visual plant growth, seeds, and harvests.
6. `src/farming/tools.js`: `ToolManager` handling Hoe, Watering Can, Seed Bag, Sickle, and Hammer.
7. `src/economy/economy.js`: `EconomyManager` handling Florins, transactions, and store catalogs.
8. `src/economy/shipping.js`: `ShippingBin` handling item deposits, dawn tallies, and payouts.
9. `src/animals/animalManager.js`: Livestock state machine for Chickens and Cows.
10. `src/construction/buildingManager.js`: 1x1m grid-snapping placement and fence connection logic.
11. `src/machinery/sprinklers.js`: Automated dawn watering engine.
12. `src/machinery/tractor.js`: Kinematic drivable tractor entity with 3-row attachments.

---

## 5. QA Verification & Testing Gates for Each Phase

Before any phase is marked complete, it must pass these strict verification tests:

| Verification Gate | Acceptance Standard | Method |
| :--- | :--- | :--- |
| **Build Stability** | `npm run build` exits with code 0 in < 1.5s with zero syntax or import errors | Automated terminal build |
| **Framerate Target** | Solid 60 FPS maintained during active gameplay | Browser Performance Tab profiling |
| **Physics Non-Regression** | Character movement, wall sliding, jumping, and step-climb remain smooth | Manual QA checklist on paths & slopes |
| **Shadow Quality** | Dynamic player shadow and tree shadows remain crisp without camera clipping | Visual inspection in first-person |
| **Save/Resume Fidelity** | Refreshing the page restores exact inventory, crop growth, and money | LocalStorage snapshot verification |
| **No Asset Errors** | Browser console reports 0 missing texture/sound 404 errors | Chrome DevTools console audit |

---

## 6. Authorized Phase 1: Visual Vertical Slice (Central Farm & Surroundings)

Per user directive, we are authorized to implement **Phase 1: Visual Vertical Slice** focusing on the central farm and its immediate surroundings:

### Phase 1 Deliverables
1. **Cozy Low-Poly Farmhouse**:
   - A properly scaled timber-and-stone farmhouse with front porch, overhang slate roof, rustic stone chimney, and warm glass windows.
   - Built with clean stepped colliders for the porch steps and front door.
2. **Crop Field & Furrow Overhaul**:
   - Replaces flat rectangular patches with rich, organic furrowed soil beds.
   - Distinct, vibrant crop visuals: bushy carrot tops with orange taproot peaks, ribbed golden pumpkins with green curling vines, and tall swaying wheat sheaves.
   - Attractive natural wooden edging and furrow pathways.
3. **Paths & Ground Transitions**:
   - Organic curved dirt and stone paths connecting the spawn clearing, farmhouse, well, crop beds, and orchard.
   - Soft, natural color blending between paths and meadow grass.
4. **Tree Foliage & Tree Materials**:
   - Upgraded multi-lobed canopy models with smooth normals and rich, vibrant warm greens (`#3d9435`, `#4caf50`, `#558b2f`).
   - Completely removes dark, murky, muddy leaf appearances.
   - Accurate trunk-only colliders ensuring zero path blocking and smooth navigation.
5. **Natural Environmental Vegetation**:
   - Organic clusters of low-poly 3D grass tufts, vibrant wildflowers (buttercups, bluebells, poppies), and lush bushes.
   - Farmyard props: wooden crates, barrels, hay bales, and stone well detailing.
6. **Perimeter Mountain Horizon**:
   - Varied mountain silhouettes with distinct ridge elevations, foothills, and snow-capped peaks replacing repetitive cones.
7. **Lighting, Atmosphere & Foliage Motion**:
   - Balanced, natural daylight: warm directional sun with PCF soft shadows, soft blue hemisphere sky-bounce, and natural atmospheric depth fog.
   - Lightweight sinusoidal wind sway applied to crops and tree leaf canopies for an organic, living meadow feeling.
8. **Gameplay Preservation**:
   - 100% preservation of kinematic movement, swept AABB collision solver, coyote time, jump buffering, harvesting raycasts, and backpack inventory.
