# Meadow Valley Simulator 2.0: Software Architecture & Technical Specification

> **Document Type**: Software Architecture & Engineering Specification  
> **Status**: Proposed Architectural Blueprint (Reviewed Baseline)  
> **Target Framework**: Vanilla JavaScript (ESM), Three.js v0.170+, WebGL 2.0, Vite 6+  

---

## 1. Architectural Philosophy

The architecture of **Meadow Valley Simulator 2.0** follows four strict design principles:

1. **Non-Destructive Evolution**:
   Preserve the existing responsive kinematic FPS movement, swept AABB collision solver, zero-asset procedural baseline, and reported 60 FPS performance envelope. Do not throw away working code.
2. **Decoupled Event-Driven Subsystems**:
   Eliminate monolithic god-classes over time. Subsystems will interact via a lightweight typed **Event Bus** (`EventHub`) rather than direct circular dependencies.
3. **Strict Data-Oriented Persistence**:
   Every gameplay system (farming, time, inventory, animals, buildings, economy) must serialize its state into a clean, versioned JSON schema managed by a central `SaveManager`.
4. **Performance & Memory Discipline**:
   Utilize Three.js `InstancedMesh` for large-scale crop fields and fence lines, enforce explicit texture/geometry disposal routines, and clamp animation delta time to maintain a solid 60 FPS under heavy simulation loads.

---

## 2. Target Project Directory Structure

As features are added in Phase 2 and beyond, modular domain directories will be introduced incrementally without prematurely breaking existing imports or moving working baseline files:

```
src/
├── core/
│   ├── engine.js             # Main game loop, RAF scheduler, delta clamping
│   ├── events.js             # Central pub/sub EventHub
│   ├── time.js               # TimeManager: 24m day/night clock, calendar, celestial arc
│   └── save.js               # SaveManager: LocalStorage / IndexedDB serialization & migrations
├── physics/
│   └── collision.js          # Preserved Swept AABB collision solver & dynamic box registry
├── player/
│   ├── player.js             # FPS controller, shadow proxy avatar, head bob, camera
│   ├── tools.js              # ToolManager: Active tool belt, Hoe, Can, Seeds, Sickle
│   └── inventory.js          # InventoryManager: Stackable slots, backpack, hotbar selection
├── farming/
│   ├── soil.js               # SoilGridManager: 1x1m tilled tiles, moisture, fertilization
│   ├── crops.js              # CropManager: 4-stage visual growth pipeline, seed logic
│   └── orchard.js            # OrchardManager: Smooth fruit trees, seasonal harvesting
├── animals/
│   ├── animalManager.js      # AnimalManager: Spawning, pasture boundaries, daily yields
│   ├── chicken.js            # Chicken entity: Roosting, clucking, egg drops
│   └── cow.js                # Dairy Cow entity: Grazing, petting, milk bucket yield
├── machinery/
│   ├── sprinklers.js         # SprinklerManager: Morning 06:00 automated tile watering
│   └── tractor.js            # TractorEntity: Drivable vehicle, tiller & harvester attachments
├── construction/
│   ├── grid.js               # BuildGrid: 1x1m snapping overlay, collision validation
│   └── buildings.js          # BuildingManager: Fences, gates, coops, barns, paths
├── economy/
│   ├── economy.js            # EconomyManager: Florin balance, transaction events
│   ├── shipping.js           # ShippingBin: Item deposit, evening ledger, dawn payout
│   └── store.js              # StoreCatalog: Seed purchasing, tool upgrade tiers
├── world/
│   ├── world.js              # World terrain mesh, stone paths, mountain barrier boundary
│   ├── weather.js            # WeatherManager: Rain particles, sky overcast, audio loops
│   ├── particles.js          # ParticleManager: Instanced points for sparks, water, dust
│   └── audio.js              # SoundSystem: Procedural Web Audio synthesizer
└── ui/
    ├── hud.js                # HUD Manager: Clock, weather icon, Florins, stamina, reticle
    ├── hotbarUI.js           # Active tool belt DOM bindings (Keys 1-8)
    ├── backpackUI.js         # Full backpack modal grid & item tooltips
    └── ledgerUI.js           # Morning Shipping Bin revenue tally screen
```

---

## 3. Subsystem Architecture & Responsibilities

```
                               ┌───────────────────────────┐
                               │   Application Bootstrap   │
                               │        (main.js)          │
                               └─────────────┬─────────────┘
                                             │
               ┌─────────────────────────────┼─────────────────────────────┐
               ▼                             ▼                             ▼
    ┌──────────────────────┐      ┌──────────────────────┐      ┌──────────────────────┐
    │     SaveManager      │      │       EventHub       │      │     TimeManager      │
    │  (LocalStorage/IDB)  │◄────►│  (Central Event Bus) │◄────►│ (Day/Night, Weather) │
    └──────────────────────┘      └──────────┬───────────┘      └──────────────────────┘
                                             │
      ┌──────────────────┬───────────────────┼───────────────────┬──────────────────┐
      ▼                  ▼                   ▼                   ▼                  ▼
┌───────────┐      ┌───────────┐       ┌───────────┐       ┌───────────┐      ┌───────────┐
│  Player & │      │  Farming  │       │ Livestock │       │ Machinery │      │ Economy & │
│ Tool Belt │      │ & Orchard │       │  Manager  │       │ & Tractor │      │ Shipping  │
└─────┬─────┘      └─────┬─────┘       └─────┬─────┘       └─────┬─────┘      └─────┬─────┘
      │                  │                   │                   │                  │
      └──────────────────┴───────────────────┼───────────────────┴──────────────────┘
                                             ▼
                               ┌───────────────────────────┐
                               │   CollisionWorld & Three  │
                               │      (Scene Graph)        │
                               └───────────────────────────┘
```

### 3.1 Core Event Bus (`src/core/events.js`)
Decouples systems from direct references. Subsystems emit and listen to strongly typed events:

```javascript
export class EventHub {
  constructor() {
    this.listeners = new Map();
  }

  on(event, callback) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event).add(callback);
    return () => this.off(event, callback);
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(cb => cb(data));
    }
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }
}

export const events = new EventHub();
```

#### Core Event Registry
- `time:minute_tick` $\to$ `{ hour, minute, day, season, timeString }`
- `time:hour_tick` $\to$ `{ hour, day, season }`
- `time:day_passed` $\to$ `{ day, season }` (triggers morning crop growth, sprinkler watering, animal produce)
- `weather:changed` $\to$ `{ weatherType }` (Sunny, Rainy, Misty)
- `crop:tilled` $\to$ `{ gridX, gridZ }`
- `crop:watered` $\to$ `{ gridX, gridZ }`
- `crop:planted` $\to$ `{ gridX, gridZ, cropId }`
- `crop:harvested` $\to$ `{ cropId, count, quality }`
- `inventory:changed` $\to$ `{ items, activeSlot }`
- `economy:florins_updated` $\to$ `{ balance, delta }`
- `shipping:item_deposited` $\to$ `{ item, count }`
- `shipping:ledger_tallied` $\to$ `{ totalEarnings, itemsSummary }`

---

### 3.2 Time & Day/Night Engine (`src/core/time.js`)
Controls global celestial motion, lighting color temperatures, and seasonal progression.

```typescript
export interface TimeState {
  timeScale: number;        // in-game seconds per real second (default: 60.0 for 24-min real day)
  currentDayTime: number;   // 0.0 to 24.0 hours (e.g., 6.5 = 06:30 AM)
  currentDay: number;       // 1 to 28
  currentSeason: 'spring' | 'summer' | 'autumn' | 'winter';
  year: number;
}
```

- **Celestial Arc Calculation**:
  $$\text{angle} = \left(\frac{\text{currentDayTime} - 6.0}{24.0}\right) \times 2\pi$$
  - The directional sun light orbits from East (`x > 0`) at 06:00 to Zenith (`y = \max`) at 12:00 to West (`x < 0`) at 18:00.
  - Light color interpolates across dawn gold (`#ffb74d`), midday bright white (`#fffaea`), dusk rose (`#ff7043`), and night moonlight (`#93c5fd`).

---

### 3.3 Persistence & Save State Schema (`src/core/save.js`)

Game state is persisted locally to `localStorage` (with fallback to IndexedDB for large worlds) under the key `meadow_valley_save_v2`:

```typescript
export interface GameSaveSchema {
  version: 2;
  timestamp: number;
  player: {
    position: { x: number; y: number; z: number };
    yaw: number;
    stamina: number;
    activeToolIndex: number;
  };
  time: {
    currentDayTime: number;
    currentDay: number;
    currentSeason: string;
    year: number;
  };
  economy: {
    florins: number;
    totalEarned: number;
    shippingBin: Array<{ id: string; count: number; quality: string }>;
  };
  inventory: {
    slots: Array<{ id: string; count: number; quality?: string } | null>;
    maxSlots: number;
  };
  tools: Array<{
    id: string;
    tier: 'starter' | 'copper' | 'iron' | 'gold';
  }>;
  farming: {
    soilTiles: Array<{
      gx: number;
      gz: number;
      tilled: boolean;
      moist: boolean;
      crop: {
        id: string;
        stage: number;      // 1 to 4
        growthProgress: number; // 0.0 to 1.0
        daysAlive: number;
      } | null;
    }>;
  };
  orchard: Array<{
    treeId: number;
    applesReady: number;
    regrowTimer: number;
  }>;
  buildings: Array<{
    id: string;
    type: string;
    gx: number;
    gz: number;
    rotation: number;
  }>;
  animals: Array<{
    id: string;
    type: 'chicken' | 'cow' | 'sheep';
    name: string;
    hearts: number;
    hasPettedToday: boolean;
    hasEatenToday: boolean;
    position: { x: number; y: number; z: number };
  }>;
}
```

---

### 3.4 Farming & Soil Tile System (`src/farming/soil.js` & `crops.js`)

To scale to hundreds of crops without creating hundreds of individual Three.js draw calls, we employ a hybrid rendering model:

1. **Soil Ground Layer**:
   - A single subdivided ground plane with a dynamic tile canvas texture (tiled $1\text{m} \times 1\text{m}$ cells) or lightweight flat tile meshes.
   - When a tile is tilled, its cell texture updates from green grass to dark furrowed brown.
   - When watered, its shade darkens to moist saturation.
2. **Crop Foliage Layer (`src/farming/crops.js`)**:
   - Each crop type (Carrot, Pumpkin, Wheat, Tomato) defines 4 discrete 3D meshes (Stage 1 Sprout, Stage 2 Vegetative, Stage 3 Mature, Stage 4 Ripe Harvest).
   - High-density crops like Wheat use `THREE.InstancedMesh` for maximum GPU efficiency.
   - Distinct interactive bounding boxes allow players to target specific tiles with raycasts.

---

### 3.5 Active Tool System (`src/player/tools.js`)

The player holds an active tool selected from the Hotbar. Each tool provides specific interaction behavior:

```typescript
export interface ToolDefinition {
  id: 'hoe' | 'watering_can' | 'seed_pouch' | 'sickle' | 'hammer';
  name: string;
  icon: string;
  energyCost: number;
  chargeLevels: number; // 1 = 1x1, 2 = 1x3, 3 = 3x3
  onUse: (player: Player, targetHit: RaycastHit) => boolean;
}
```

- **Hoe**: Validates target tile is untilled grass; creates new `SoilTile(gx, gz)`; plays dirt crunch sound.
- **Watering Can**: Checks water charge; saturates `SoilTile` to `moist: true`; spawns water splash particles; plays fluid trickle sound.
- **Seed Pouch**: Checks selected seed count in backpack; attaches new `CropInstance` to tilled tile; plays seed rustle sound.
- **Sickle**: Swings horizontal cutting arc; harvests ripe grains and clears weeds.

---

### 3.6 Livestock State Machine (`src/animals/animalManager.js`)

Every farm animal runs a lightweight behavior tree:

```
                  ┌────────────────────────┐
                  │       ANIMAL SPAWN     │
                  └───────────┬────────────┘
                              │
               ┌──────────────┴──────────────┐
               ▼                             ▼
    ┌──────────────────────┐      ┌──────────────────────┐
    │     STATE: IDLE      │      │    STATE: GRAZING    │
    │ Look around, twitch  │◄────►│ Head down, chew grass│
    │ ears, soft cluck/moo │      │ Particle grass bites │
    └──────────┬───────────┘      └──────────┬───────────┘
               │                             │
               └──────────────┬──────────────┘
                              │
               ┌──────────────┴──────────────┐
               ▼                             ▼
    ┌──────────────────────┐      ┌──────────────────────┐
    │    STATE: FOLLOW     │      │    STATE: SLEEP      │
    │ Follows player if    │      │ Lies down at night   │
    │ player holds feed    │      │ (22:00 to 06:00)     │
    └──────────────────────┘      └──────────────────────┘
```

- **Care & Production**:
  - `pet()`: Spawns floating heart particles, increments happiness (`hearts += 0.2`, max 5.0), plays affectionate audio.
  - Morning 06:00 tick checks: If `hasEatenToday && hearts >= 1.0`, spawns produce drop (Egg, Milk, Wool) adjacent to the animal.

---

### 3.7 Construction & Building System (`src/construction/`)

- Snaps to global integer grid:
  $$x_{\text{grid}} = \text{Math.floor}(x_{\text{hit}} + 0.5), \quad z_{\text{grid}} = \text{Math.floor}(z_{\text{hit}} + 0.5)$$
- Validates that target grid cells are free of mountain barriers, water wells, or existing buildings.
- Displays a translucent green/red preview mesh following the raycast cursor.
- Upon placement:
  1. Instantiates structure mesh.
  2. Registers bounding box collider with `CollisionWorld`.
  3. Emits `building:structure_placed` event.
  4. Triggers auto-save.

---

## 4. Performance & Memory Management Strategy

| Subsystem | Potential Bottleneck | Architectural Solution |
| :--- | :--- | :--- |
| **Crops (100+ Plants)** | Draw call overhead from dozens of unique meshes | Use `THREE.InstancedMesh` for repeated crop growth stages; share materials. |
| **Fencing & Paths** | Hundreds of individual fence post colliders | Combine contiguous straight fence segments into single compound AABB boxes. |
| **Shadows & Lighting** | Shadow map draw call penalties | Use single directional sun light shadow map; freeze shadow frustum to farm play area. |
| **Audio Oscillators** | Web Audio node leaks | Connect nodes through strict envelope gates and explicitly disconnect/stop oscillators on completion. |
| **Disposal Routines** | GPU memory leaks when harvesting/clearing | Helper `disposeHierarchy(object)` explicitly frees `geometry.dispose()` and `material.dispose()`. |

---

## 5. Architectural Quality Attributes

1. **Modularity**: Every folder under `src/` has a single, well-defined domain responsibility.
2. **Testability**: Game logic (crop growth formulas, economic sell prices, tool energy formulas) is decoupled from Three.js rendering code.
3. **Observability**: Game events flow through `EventHub`, allowing easy integration of telemetry, debug overlays, and quest listeners.
4. **Resilience**: Corrupt or missing save states fallback gracefully to a pristine new-game state with schema version migrations.
