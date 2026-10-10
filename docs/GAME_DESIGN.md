# Meadow Valley Simulator 2.0: Master Game Design Document (GDD)

> **Document Type**: Master Game Design Document (GDD)  
> **Status**: Proposed Game Design Specification (Reviewed Baseline)  
> **Target Audience**: Single-player desktop browser gamers seeking cozy, tactile 3D simulation  
> **Genre**: First-Person 3D Cozy Agricultural & Homesteading Simulator  

---

## 1. Product Vision & Core Fantasy

**Meadow Valley Simulator 2.0** is a peaceful, satisfying first-person 3D farming simulator set in an alpine river basin surrounded by snowy mountain peaks. 

The core player fantasy is **transforming a modest open meadow into a flourishing, automated agricultural estate**. Players start with basic hand tools (a hoe, watering can, and a packet of seeds) and gradually build tilled fields, plant fruit orchards, adopt livestock, install automated sprinklers, drive tractors, and trade with the nearby village community.

```
                           ┌───────────────────────────┐
                           │    HOMESTEAD CORE LOOP    │
                           └─────────────┬─────────────┘
                                         │
             ┌───────────────────────────┴───────────────────────────┐
             ▼                                                       ▼
  ┌──────────────────────┐                                ┌──────────────────────┐
  │   HANDS-ON TENDING   │                                │   FARM EXPEDITION    │
  │ Hoeing, Seeding,     │                                │ Foraging, Gathering, │
  │ Watering, Petting    │                                │ Orchard Harvesting   │
  └──────────┬───────────┘                                └──────────┬───────────┘
             │                                                       │
             └───────────────────────────┬───────────────────────────┘
                                         ▼
                              ┌──────────────────────┐
                              │  EVENING HARVEST     │
                              │ Deposit in Shipping  │
                              │ Bin / Town Orders    │
                              └──────────┬───────────┘
                                         ▼
                              ┌──────────────────────┐
                              │   NIGHTLY REVENUE    │
                              │ Gold Profit Ledger,  │
                              │ Farm XP, Level-ups   │
                              └──────────┬───────────┘
                                         │
             ┌───────────────────────────┴───────────────────────────┐
             ▼                                                       ▼
  ┌──────────────────────┐                                ┌──────────────────────┐
  │  REINVESTMENT & EXP  │                                │     AUTOMATION &     │
  │ Tool Upgrades, Barns,│                                │      MACHINERY       │
  │ Livestock, New Seeds │                                │ Sprinklers, Tractors │
  └──────────────────────┘                                └──────────────────────┘
```

---

## 2. Core Game Pillars

1. **Tactile First-Person Physics**:
   Every farming action has tactile weight and audible consequence: hoeing crunches dry dirt, water splashes with fluid droplets, sickle swipes cut through golden stalks, and ripe crops pluck with a satisfying pop.
2. **Cozy, Living Atmosphere**:
   A dynamic 24-minute day/night cycle, golden sunrises, twilight mountain silhouettes, gentle breezes causing crops to sway, periodic birdsong, and rainfall that naturally irrigates the soil.
3. **Meaningful Economic Progression**:
   No dead ends. Money earned from modest carrot harvests fuels copper tools, which enables wider fields, unlocking livestock, shipping contracts, and machinery.
4. **Architectural & Placement Freedom**:
   Players can organize their farm layout however they desire. A snap-to-grid building system allows laying stone paths, building timber fences, placing chicken coops, and setting up irrigation lines anywhere in the valley.
5. **A Living Community**:
   The valley is home to distinct villagers with daily routines, dialogue trees, store inventories, and request boards.

---

## 3. The Agricultural Engine

### 3.1 Soil Tile Grid & Dynamics
The farm area supports a dynamic $1\text{m} \times 1\text{m}$ grid of interactive soil tiles.

```
       [Grass / Native Earth]
                 │
                 │ Strike with HOE
                 ▼
       [Tilled Soil (Dry)] ◄──── Neglected 24 in-game hours
                 │
                 │ WATERING CAN / Rain / Sprinkler
                 ▼
       [Tilled Soil (Moist)] ─── Dark, rich brown, accelerates growth
                 │
                 │ Plant SEEDS
                 ▼
       [Sprout (Stage 1)]
                 │
                 │ Daily Watering & Sunlight
                 ▼
       [Vegetative (Stage 2)]
                 │
                 │ Daily Watering
                 ▼
       [Flowering / Mature (Stage 3)]
                 │
                 │ Final Ripening
                 ▼
       [Harvestable Crop (Stage 4)] ─── Pluck or SICKLE
                 │
                 ▼
       Yields Crops + Seed Drops ──► Backpack / Shipping Bin
```

- **Soil States**:
  - `Grass`: Default natural meadow. Can be tilled with a Hoe.
  - `Tilled Dry`: Prepared furrowed earth. Will revert to grass after 48 unplanted hours.
  - `Tilled Moist`: Saturated earth (dark brown shader tone). Required for daily crop progress.
  - `Fertilized`: Enhanced with compost/fertilizer (increases Gold quality yield chance by 35%).

### 3.2 Tools of the Trade
The player selects tools via Hotbar keys <kbd>1</kbd>–<kbd>8</kbd> or mouse wheel:

| Tool | Base Functionality | Upgraded (Copper / Iron) |
| :--- | :--- | :--- |
| **Hands (Empty)** | Pluck ripe crops, pick fruit, pet animals, carry crates | Faster pickup radius |
| **Hoe** | Tills a $1\times 1$ soil tile into arable farmland | Hold <kbd>LMB</kbd> to till $1\times 3$ or $3\times 3$ tiles |
| **Watering Can** | Pours water on a tilled tile (stores 40 charges, refilled at well) | Hold <kbd>LMB</kbd> to water $1\times 3$ or $3\times 3$ tiles |
| **Seed Pouch** | Plants selected seeds into tilled soil | Plants a row in one swing |
| **Sickle** | Rapidly cuts mature grains (wheat, barley) and clears weeds | Wide sweeping arc |
| **Axe** | Clears fallen timber, gathers wood resources | Fells larger hardwood trees |
| **Pickaxe** | Breaks mineral deposits and removes unwanted tilled tiles | Destroys boulders in 1 strike |
| **Hammer** | Enters Farm Construction mode | Repairs buildings, relocates structures |

### 3.3 Crop Catalog & Growth Timers

| Crop | Seed Cost | Base Growth | Daily Water Needed | Harvest Yield | Sell Price (Base / Gold) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Carrot** | 5 VF | 3 In-Game Days | Yes | 1–2 Carrots | 14 VF / 22 VF |
| **Country Pumpkin** | 20 VF | 6 In-Game Days | Yes | 1 Giant Pumpkin | 75 VF / 120 VF |
| **Golden Wheat** | 4 VF | 4 In-Game Days | Yes | 2–3 Wheat + Seeds | 12 VF / 18 VF |
| **Sweet Strawberry** | 15 VF | 4 In-Game Days | Yes (Regrows every 2d) | 2–3 Berries | 32 VF / 50 VF |
| **Summer Corn** | 18 VF | 5 In-Game Days | Yes (Regrows every 3d) | 2 Cobs | 45 VF / 70 VF |
| **Vine Tomato** | 12 VF | 4 In-Game Days | Yes (Regrows every 2d) | 3 Tomatoes | 28 VF / 42 VF |

### 3.4 Fruit Orchards
Fruit trees are permanent perennial investments. Once planted from saplings, they grow over 10 in-game days and yield seasonal fruits that hang from branches and regrow every 3 in-game days:
- 🍎 **Apple Trees**: Sweet crisp fruit (Sell: 25 VF each).
- 🍑 **Peach Trees**: Delicate summer fruit (Sell: 35 VF each).
- 🍊 **Orange Trees**: Citrus harvest (Sell: 30 VF each).

---

## 4. Livestock & Animal Husbandry

Animals live in dedicated farm enclosures, possess personality and happiness ratings, and produce valuable daily artisan goods.

```
                  ┌─────────────────────────────────────────┐
                  │          DAILY ANIMAL CYCLE             │
                  └────────────────────┬────────────────────┘
                                       │
                 ┌─────────────────────┴─────────────────────┐
                 ▼                                           ▼
      ┌──────────────────────┐                    ┌──────────────────────┐
      │     FEEDING CARE     │                    │     AFFECTION CARE   │
      │ Hay in trough OR     │                    │ Approach & Pet (<kbd>E</kbd>)   │
      │ Open pasture grazing │                    │ Heart bubble pops up │
      └──────────┬───────────┘                    └──────────┬───────────┘
                 │                                           │
                 └─────────────────────┬─────────────────────┘
                                       ▼
                          ┌────────────────────────┐
                          │   HAPPINESS RATING     │
                          │   (1 to 5 Hearts)      │
                          └────────────┬───────────┘
                                       ▼
                          ┌────────────────────────┐
                          │   DAILY MORNING YIELD  │
                          │ Eggs, Milk, Wool       │
                          │ Quality tied to Hearts │
                          └────────────────────────┘
```

### Animal Species Specifications

1. **Chickens**:
   - **Housing**: Chicken Coop (capacity: 4–8 chickens).
   - **Feeding**: Wheat seed or outdoor grass pecking.
   - **Daily Yield**: 🥚 Fresh Egg (40 VF) / Large Golden Egg (85 VF).
   - **Behaviors**: Clucking, pecking ground, flapping wings, sleeping in roosts at night.

2. **Dairy Cows**:
   - **Housing**: Pasture Barn (capacity: 4 cows).
   - **Feeding**: Hay bale in barn trough or open meadow grazing.
   - **Daily Yield**: 🥛 Milk Pail (Milk with milk bucket item) (95 VF) / Cream Jug (180 VF).
   - **Behaviors**: Grazing, chewing cud, following player holding hay, gentle lowing.

3. **Wool Sheep**:
   - **Housing**: Pasture Barn.
   - **Yield**: 🧶 Wool Fleece (sheared every 3 days with Shears tool) (140 VF).
   - **Behaviors**: Flocking together, gentle bleating, coat regrowth animation after shearing.

---

## 5. Farm Construction & Customization

Entering Construction Mode (<kbd>H</kbd> or with the Hammer tool; preserving <kbd>Tab</kbd> / <kbd>B</kbd> for Backpack) activates a translucent $1\text{m} \times 1\text{m}$ grid overlay on the meadow floor with color-coded placement validation:
- **Green**: Valid build zone.
- **Red**: Blocked by trees, water well, or boundary mountains.

### Buildable Assets

1. **Fencing & Access**:
   - Split-Rail Wooden Fence (1 Wood each): Connects cleanly with neighboring posts.
   - Functional Latch Gate: Swings open/close with <kbd>E</kbd> or player proximity.
   - Stone Wall Border: Sturdy decorative perimeter.
2. **Pathways** (Accelerates player walking speed by +25%):
   - Cobblestone Paving.
   - Rustic Wooden Planks.
   - Gravel / Dirt Trail.
3. **Agricultural Buildings**:
   - **Chicken Coop**: House up to 8 chickens, includes exterior run.
   - **Animal Barn**: House up to 4 cows and 4 sheep, includes exterior corral.
   - **Storage Silo**: Stores up to 200 units of hay harvested with the sickle.
   - **Greenhouse**: Weather-proof indoor growing area for out-of-season crops.
4. **Decorations & Lighting**:
   - Solar Lantern Posts (glow automatically at dusk).
   - Wooden Picnic Benches and planters.
   - Village Windmill (enhances water pump pressure).

---

## 6. Irrigation, Machinery & Farm Automation

As the farm expands, manual watering becomes a bottleneck. Automation systems provide late-game operational scale:

1. **Sprinkler Technology**:
   - **Basic Sprinkler**: Waters 4 adjacent tiles (Cross shape) every morning at 06:00.
   - **Quality Sprinkler**: Waters all 8 surrounding tiles ($3\times 3$ area).
   - **Pressure Sprinkler**: Waters a full $5\times 5$ grid (24 tiles).
2. **Drip Irrigation Piping**:
   - Pipes connect from the Central Stone Well directly to crop beds.
3. **Drivable Farm Tractor**:
   - **Controls**: WASD driving physics with realistic turning radius, engine rumble audio, and working headlights at night.
   - **Modular Tool Attachments**:
     - *3-Row Tiller*: Tills 3 rows of soil simultaneously.
     - *3-Row Seed Drill*: Plants seeds into 3 tilled rows on the fly.
     - *Harvester Header*: Cuts and harvests 3 rows into the tractor storage hopper.

---

## 7. Economic Progression & The Market

### 7.1 Currency & The Shipping Bin
- **Currency**: `Valley Florins (VF)`.
- **The Shipping Bin**: Located beside the central well.
  - Drop produce, eggs, milk, wool, and fruit into the bin at any time.
  - At 06:00 dawn, the **Daily Ledger** screen appears, breaking down itemized sales and depositing Florins into the player account.

### 7.2 Town General Store & Blacksmith
- **Sam's Country Store**:
  - Sells crop seed packets, tree saplings, animal feed bags, and basic farm permits.
- **Goran's Smithy**:
  - Upgrades tools (Wood $\to$ Copper: 1,500 VF $\to$ Iron: 5,000 VF $\to$ Gold: 15,000 VF).
  - Sells metal building components and sprinkler nozzles.

### 7.3 Milestone Progression Tiers

```
  [TIER 1: THE TENDER]
  • 1 small plot, hand watering, carrots & wheat, starter backpack (8 slots)
        │ Earn 1,000 VF & Harvest 25 Crops
        ▼
  [TIER 2: THE HOMESTEADER]
  • Copper tools, Chicken Coop, Orchard rows, Strawberry crops, 16-slot backpack
        │ Earn 5,000 VF & Build Coop
        ▼
  [TIER 3: THE RANCHER]
  • Animal Barn, Dairy Cows, Basic Sprinklers, Storage Silo, Quality crops
        │ Earn 20,000 VF & Keep 4 Happy Animals
        ▼
  [TIER 4: THE AGRONOMIST]
  • Drivable Tractor, Pressure Sprinklers, Greenhouse, Automated Chutes
```

---

## 8. NPCs, Quests & Town Living

The nearby riverside hamlet brings warmth and narrative life to Meadow Valley:

### Core Characters
1. **Mayor Barnaby**: Jovial elderly valley mayor. Welcomes the player, explains town traditions, and rewards farm milestone licenses.
2. **Lin the Botanist**: Passionate crop scientist. Researches rare seeds, offers agricultural tips, and pays bonus rates for Gold-quality vegetables.
3. **Goran the Blacksmith**: Gruff, kind craftsman who works metal tools, tractor engines, and irrigation parts.
4. **Mae the Rancher**: Animal lover who runs the livestock sanctuary. Sells baby chicks, calves, and gives animal care advice.

### The Notice Board (Daily Contracts)
Every morning, the village notice board posts randomized local requests:
- *"Mayor Barnaby needs 3 Pumpkins for the autumn pie"* $\to$ 250 VF + 20 Town Reputation.
- *"Goran needs 10 Wheat Bundles for forge straw insulation"* $\to$ 180 VF.

---

## 9. Dynamic World, Atmosphere & Seasons

- **Day / Night Clock**:
  - A 24-minute real-time day = 1,440 real seconds = 1,440 in-game minutes = 86,400 in-game seconds.
  - **Time Ratio**: **60 in-game seconds per real-world second** ($60\times$ speed).
  - 1 Real-World Second = 1 In-Game Minute (60 in-game seconds).
  - 1 Real-World Minute = 1 In-Game Hour (60 in-game minutes).
  - Full 24-hour day lasts exactly **24 real minutes** (1,440 seconds).
  - Time milestones:
    - `06:00 Dawn`: Roosters crow, morning shipping tally calculated, sprinklers fire.
    - `12:00 Noon`: Brightest sunlight, warm golden shadows.
    - `18:00 Sunset`: Sky burns amber/rose, lanterns ignite.
    - `22:00 Night`: Dark blue starry sky, farm animals sleep.
    - `02:00 Exhaustion`: If player stays awake without sleeping in bed, passes out and wakes at 06:00 with half stamina.
- **Weather Dynamics**:
  - `SUNNY`: Standard sunny weather.
  - `RAINY`: Pours rain with droplet particles; **all outdoor crops are automatically watered** for the day!
  - `MORNING MIST`: Soft atmospheric valley fog burning off by 10:00.
- **Four Seasons** (28 days per season):
  - **Spring**: Cherry blossom petals, wild strawberries, mild rains.
  - **Summer**: Long daylight, corn and tomatoes, golden afternoons.
  - **Autumn**: Orange/crimson foliage, pumpkins, harvest festival.
  - **Winter**: Frosty ground, greenhouse cultivation, snow-capped trees.

---

## 10. User Interface & Ergonomics

1. **Contextual Diegetic Reticle**:
   - Replaces FPS crosshairs with an intelligent interaction dot that expands when gazing at interactive objects with an action badge:
     `[E] Till Soil`, `[E] Water Plot`, `[E] Harvest Carrot`, `[E] Pet Daisy the Cow`.
2. **Active Tool Belt (Hotbar)**:
   - Centered at the bottom of the screen with slots <kbd>1</kbd>–<kbd>8</kbd>. Shows selected tool icon, remaining water capacity, or seed count.
3. **Compass & Clock Widget**:
   - Top-right corner showing current in-game time (`08:30 AM`), weather icon, Day of Season (`Spring 4`), and current Florin balance.
4. **Backpack & Farm Ledger** (<kbd>B</kbd> or <kbd>Tab</kbd>):
   - Clean, tactile grid inventory with item tooltips, selling values, and storage management.
