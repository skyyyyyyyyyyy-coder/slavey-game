<USER_REQUEST>
# MEADOW VALLEY SIMULATOR
# MILESTONE C — PREMIUM BLENDER CROPS, FARMLAND RECONSTRUCTION & COMPLETE FARMING VISUAL SYSTEM

## MASTER IMPLEMENTATION SPECIFICATION

**Project:** Meadow Valley Simulator  
**Milestone:** C — Farming Assets & Crop Lifecycle Redesign  
**Technology:** Three.js 0.170, Vite, JavaScript ES Modules, Blender 5.2.2, Blender MCP  
**Quality standard:** Premium stylized-realistic farming simulator  
**Priority:** Visual quality, gameplay correctness, coherent art direction, performance, and stability  
**Execution:** Audit → Design → Prototype → Approval → Implementation → Verification  
**Important restriction:** Do not begin this milestone until Milestone B has been completed, its remaining defects have been repaired, and I have approved the results.

---

# PART I — PROJECT DIRECTIVES

## 1. Mission and expected outcome

You are responsible for transforming the existing farming system in Meadow Valley Simulator from a simple procedural prototype into a visually compelling, polished, cohesive, interactive farming experience.

This is not merely a texture replacement exercise.

I want the crops, soil, fields, borders, farming tools, planting actions, watering effects, growth animations, and harvesting feedback to look and behave as though they belong in a thoughtfully designed commercial farming game.

The resulting farming environment should feel beautiful at normal gameplay distance, convincing during close inspection, readable while performing farming actions, and visually consistent throughout the day/night cycle.

The current approved Blender apple tree is a useful minimum reference for shape quality, organic modeling, correct attachment points, and gameplay integration. However, you are encouraged to improve beyond that standard where appropriate.

The goal is not to maximize polygons, use the most complicated shaders, or make every surface photorealistic. The goal is to use the available technology intelligently to achieve the highest practical visual quality while keeping the game fluid and easy to play.

Every crop species must be immediately recognizable.

Every growth stage must communicate meaningful visual progression.

Every tilled tile must be placed accurately.

Every crop must emerge naturally from the ground.

Every interaction must respond correctly.

Every newly created visual element must integrate into the existing gameplay and save systems.

Do not trade gameplay correctness for decorative detail.

Do not trade attractive graphics for unstable performance.

Do not declare the milestone complete simply because assets have been exported and the build passes.

The work is complete only when the visual experience, farming interactions, progression, persistence, performance, and collision behavior have all been verified in the running game.

## 2. Existing architecture and milestone boundaries

The project already has a working Three.js/Vite game architecture, a custom player controller, collision system, day/night cycle, inventory, farming progression, save system, and an approved Blender orchard upgrade.

Milestone A reportedly established valid farming zones, one-meter tile alignment, safer mountain boundaries, and an asset-loading pipeline.

Milestone B focuses on the farmhouse and interactive interior.

Milestone C must build on these systems rather than unnecessarily replacing them.

Before touching any code, inspect the actual current repository.

Do not assume that an older implementation plan accurately describes the latest code.

Determine which systems are already present, which are unfinished, and which have changed during Milestone B.

Preserve completed Milestone A and B work.

Do not modify the farmhouse, its staircase collisions, doors, interior, furniture, or storage architecture unless an unavoidable integration dependency is discovered. If such a dependency exists, document it and obtain approval before changing unrelated systems.

Do not begin the well, fences, roads, mountains, clouds, or landscape reconstruction planned for Milestones D and E.

Do not add economy, NPC, animal, vehicle, or new weather systems.

Do not introduce new gameplay mechanics beyond the approved farming redesign without explicitly identifying them as proposed additions.

The intended scope is crop models, farming tile visuals, crop progression presentation, soil materials, field edging, farming-related effects, and the directly required supporting gameplay integration.

## 3. Mandatory use of specialized skills

Discover and apply the actual installed instructions for these skills:

- `threejs-game-director`
- `threejs-gameplay-systems`
- `threejs-aaa-graphics-builder`
- `threejs-debug-profiler`
- `threejs-qa-release`

Read their current SKILL.md files instead of assuming their contents.

The game-director workflow should coordinate artistic decisions, scope, milestone acceptance, and architectural consistency.

The gameplay-systems workflow should supervise farming states, planting, watering, harvesting, progression, input handling, and persistence.

The graphics-builder workflow should guide Blender modeling, PBR materials, geometry design, lighting integration, shaders, and asset presentation.

The debug-profiler workflow should identify inefficiencies, render-state problems, GPU resource leaks, instancing issues, and performance regressions.

The QA workflow should establish deterministic tests, run browser-based verification, inspect screenshots, and produce a complete issue report.

Do not claim that a skill was used without performing a specific, relevant step from its actual instructions.

If a skill is missing or unavailable, disclose that accurately and continue only with an appropriate fallback approved by the project architecture.

Use Blender MCP for model creation and inspection. Use Three.js for rendering, state management, animations, interaction logic, placement, and game behavior.

Blender must remain a development-time asset-authoring dependency, not a runtime requirement for players.

---

# PART II — PRE-IMPLEMENTATION AUDIT AND DESIGN FREEZE

## 4. Inspect the latest repository before designing anything

Start by recording the current Git branch, commit hash, working-tree state, and existing project structure.

Identify all source files responsible for crop definitions, farming states, growth timing, watering, inventory changes, visual generation, asset loading, collision handling, save serialization, and UI notifications.

Inspect modules such as `src/farming.js`, `src/world.js`, `src/assetPipeline.js`, `src/inventory.js`, `src/daynight.js`, `src/save.js`, and `src/main.js` where they exist. These are candidate files, not permission to modify all of them.

Find the actual crop registry.

Determine whether carrot, wheat, pumpkin, and tomato are all currently playable.

Check the current number of growth stages and their progression rules.

Identify how the game represents growth: numeric stages, accumulated days, timers, watered-day counters, maturity flags, or another mechanism.

Inspect how soil tiles are created and how they store their coordinates.

Confirm the actual soil surface height.

Confirm how grid cells are mapped to world coordinates.

Identify the current asset caching and disposal strategy.

Check whether save-schema version 2 is still active.

Determine whether the existing farming system already supports crop regrowth or repeated harvesting.

Inspect the current weather and lighting interfaces before designing any dynamic material behavior.

Inspect existing tests and determine what they actually validate.

Capture a baseline screenshot set showing the current crop models, tilled soil, field layout, farming feedback, and harvest effects.

Measure baseline performance before introducing new assets.

Document your findings in a concise but specific preflight audit.

Do not invent test results, file locations, capabilities, or current gameplay features.

If source code disagrees with the earlier implementation plan, treat the current repository as authoritative and report the discrepancy.

## 5. Establish a safe source-control checkpoint

Before implementation, make a safe Git checkpoint.

Do not erase uncommitted user changes.

Do not run destructive reset or cleanup commands without explicit authorization.

If the working tree contains modifications, identify their origin before proceeding.

Prefer a dedicated Milestone C feature branch or another non-destructive checkpoint.

Keep Milestone B's approved implementation recoverable.

Record the original commit and a clear list of files expected to change.

Separate source asset files, runtime exports, code, tests, screenshots, and temporary render artifacts.

Do not commit unnecessary Blender backup files, massive intermediate texture exports, browser cache directories, or generated files unrelated to the milestone.

Use clear, understandable commits grouped by architectural changes.

For example, the asset pipeline, crop models, soil renderer, and test infrastructure should remain distinguishable in Git history.

Do not automatically merge Milestone C into another branch.

Do not remove the existing procedural fallback until all replacement assets and interactions have passed verification.

Maintain a reversible implementation throughout the milestone.

## 6. Lock the visual art direction

The target style is **premium stylized realism with warm pastoral charm**.

The world should look artistic and handcrafted while maintaining believable plant anatomy, recognizable crop shapes, and convincing materials.

Avoid crude low-poly placeholders, but do not chase unnecessary photorealism that conflicts with the rest of Meadow Valley.

Use organic forms, controlled asymmetry, subtle imperfections, carefully chosen color palettes, and attractive silhouettes.

Farm crops should have richer geometry than their old procedural equivalents.

Leaf shapes should resemble actual leaves instead of flattened cubes, repeated spheres, or random triangles.

Stems should branch logically.

Pumpkin vines should connect to their fruit.

Tomato clusters should hang from their supporting plant.

Wheat should have recognizable heads and slender stalks.

Carrot foliage should be botanically convincing.

The field should contain subtle variation without looking disorganized.

Soil should appear textured and tactile, rather than perfectly smooth plastic or raised chocolate-colored cylinders.

The wood should look like real timber with grain, natural variation, and sensible construction.

The color palette should balance rich greens, earthy browns, warm harvest golds, subtle reddish accents, and natural weathering.

Avoid oversaturated neon grass, uniformly glossy leaves, excessively dark shadows, and muddy colors that make crop species difficult to distinguish.

Make the scene attractive at midday, sunrise, sunset, twilight, and night.

Do not use post-processing to compensate for poorly modeled assets or fundamentally incorrect lighting.

Ensure the overall aesthetic remains consistent with the farmhouse and approved Blender orchard.

---

# PART III — BLENDER ASSET PRODUCTION STANDARDS

## 7. Build a reusable crop asset system

Produce editable Blender source assets and optimized runtime GLB files.

The approved design includes four crop species with four recognizable growth stages each.

That means sixteen distinct visual growth-stage representations.

These may be organized as one GLB per crop containing four named stage nodes, or as separate optimized files if profiling shows that structure to be preferable.

Choose the organization after evaluating loading, caching, instancing, material sharing, and maintainability.

Do not automatically export sixteen files if four intelligently organized files provide a cleaner solution.

Use stable and descriptive names such as:

`crop_carrot`  
`crop_wheat`  
`crop_pumpkin`  
`crop_tomato`

Within each asset, clearly identify Stage 1, Stage 2, Stage 3, and Stage 4.

For example, node names may use `stage_01_seedling`, `stage_02_growing`, `stage_03_maturing`, and `stage_04_harvest_ready`.

Keep names consistent across crop species.

The source assets must remain editable.

Avoid unnecessary destructive joins in the Blender source file.

Organize objects into logical collections.

Separate source geometry, reference objects, export-ready meshes, and debugging helpers.

The runtime export must exclude lights, cameras, hidden references, unused empties, and collision meshes that are unnecessary for crop rendering.

Use proper export filters rather than blindly exporting an entire Blender scene.

Every exported model must load correctly through the existing Three.js asset pipeline.

## 8. Model transforms, pivots, and world-scale standards

This is a critical technical requirement.

The previous apple-tree growth issue demonstrated the danger of incorrect pivots, origins, parenting, and animation transforms.

Do not repeat that mistake with crops.

Each crop must have a clearly defined local coordinate system.

Use consistent game-world units corresponding to Blender's meter-scale modeling workflow.

Set the crop's root transform at the soil attachment point.

The root must remain fixed when crop growth changes.

Leaves, stems, fruit, and growth-stage meshes should be positioned relative to that root.

Do not place the model origin in the center of its canopy or halfway up the stem if growth animation will scale the entire model.

Do not introduce arbitrary world offsets into exported stage models.

When importing GLB files, account explicitly for Blender-to-glTF axis conversion.

Do not guess whether a world-space vertical axis is Y or Z.

Verify the exported model against a calibration asset and against the actual Three.js scene.

Apply necessary object transforms correctly before export, while preserving intentionally animated pivots.

Do not apply transforms in a way that destroys hinge positions, stage roots, animation anchors, or other meaningful object relationships.

Every growth stage for a species must share the same logical origin.

A crop must not jump sideways when switching from one stage to another.

Growth-stage changes must not introduce changes in rotation, ground attachment, or tile-center alignment.

Test each crop at the center of a known farming cell.

Inspect it in front, side, top, and perspective views.

Verify that its lowest relevant geometry appropriately contacts or emerges from the soil.

Keep roots or buried plant portions concealed where they should be concealed.

Avoid visible holes between stems and ground.

## 9. Geometry quality and optimization standards

Use detailed geometry where it improves recognizable silhouettes and close-up appearance.

Do not distribute polygon density uniformly.

Place more geometric detail around important curves, organic outlines, branching points, prominent leaves, recognizable fruit, and visible flower structures.

Use fewer polygons on nearly flat, hidden, microscopic, or distant surfaces.

Avoid extreme tessellation of simple objects.

Avoid creating dense subdivision surfaces merely to produce smoother lighting.

Use smooth shading selectively for organic rounded objects.

Preserve sharp edges where appropriate, such as wooden supports or angular seed heads.

Correct flipped normals and degenerate geometry.

Eliminate accidental duplicated faces, disconnected floating pieces, and self-intersections that create visible artifacts.

Check all mesh normals and face winding.

Avoid z-fighting between overlapping leaves or soil layers.

Ensure transparent or alpha-clipped foliage is used only when beneficial.

If alpha clipping is used, evaluate edge aliasing, depth sorting, shadow behavior, and overdraw.

Prefer clean, well-designed geometry to enormous stacks of overlapping transparency planes.

The previous plan proposed a maximum of approximately 600 triangles per crop stage. Treat this as the initial optimization budget, not permission to produce ugly models.

If a richer model needs additional geometry, measure the total impact and propose a justified budget adjustment rather than secretly exceeding the agreed constraints.

Be especially careful with wheat, where many repeated stalks can multiply triangle counts quickly.

For pumpkin and tomato, prioritize the main shapes and readable details over invisible mesh complexity.

Create LODs only when they demonstrate a measurable benefit at actual gameplay distances.

Do not create complex LOD infrastructure without a clear performance reason.

## 10. Material and texture standards

All crops must use a consistent material workflow compatible with Three.js and glTF.

Prefer physically based materials with believable roughness and restrained metallic values.

Most plant surfaces should appear predominantly nonmetallic.

Avoid glossy plastic-looking leaves.

Avoid metallic fruit unless there is a deliberate artistic reason.

Use subtle roughness variation to distinguish waxy leaves, dry stalks, ripe fruit, soil, and wooden materials.

Carrot foliage should have natural green variation.

Wheat should transition from lively green growth to mature golden grain.

Pumpkin skin should show controlled tonal variation around ribs and ridges.

Tomato skins may have slightly glossy highlights, but should not resemble chrome spheres.

Use texture maps only when they meaningfully improve the visuals.

If vertex colors provide sufficient detail for small assets, use them.

If textures are needed, optimize their resolution to actual screen-space visibility.

Avoid allocating separate large texture maps for every tiny object.

Reuse texture atlases or shared material groups where practical.

Verify correct sRGB handling for color textures.

Use linear-space handling for normal, roughness, and other non-color textures.

Avoid double gamma correction.

Do not modify the application's global tone mapping or exposure solely to make one crop look acceptable.

Materials should hold up under the existing day/night lighting system.

Check that shading does not produce excessively black undersides or strange green reflections.

Check that plant materials remain attractive under sunrise and sunset lighting without becoming radioactive or muddy.

---

# PART IV — INDIVIDUAL CROP SPECIFICATIONS

## 11. Carrots — four distinct Blender growth stages

Carrots should look like believable root vegetables growing in soil, not orange spheres or simple cones placed on brown blocks.

The plant should communicate that the edible root is primarily underground.

**Stage 1 — Seedling**

Create a tiny, delicate green shoot with appropriately small initial leaves.

The previous design reference suggested a height near 0.08 meters.

The seedling should look fragile but clearly visible at normal gameplay distance.

Use slender stems and recognizable early foliage.

Avoid making the first stage so tiny that the player cannot tell whether a seed has been planted.

Do not add a mature carrot root floating above the surface.

The attachment point must remain fixed at soil level.

**Stage 2 — Growing**

Increase the foliage height to approximately 0.25 meters, subject to actual game-scale verification.

Develop multiple finely divided carrot leaves.

Avoid perfectly identical mirrored leaves.

Introduce gentle variation in leaf orientation, angle, and size.

The foliage should form a natural emerging plant.

Keep the orange root mostly concealed.

The player should immediately see a meaningful difference between Stage 1 and Stage 2.

**Stage 3 — Maturing**

Develop a denser, fuller canopy of feathery carrot greens.

The reference height is approximately 0.45 meters.

Introduce subtle height differences between leaves.

Allow a hint of the carrot crown near the soil surface, without exposing the entire root.

Do not create a floating orange fruit above the foliage.

**Stage 4 — Harvest-ready**

Create an abundant leafy top with recognizable carrot foliage and a subtle orange crown emerging from the soil.

The reference visual height is approximately 0.55 meters.

Make it unmistakably ready to harvest through visual fullness and appropriate color development.

The carrot should remain grounded.

During harvest, the plant should disappear or animate in a way consistent with the existing harvesting system.

If a carrot-pull animation is feasible, briefly lift the root from the ground along a controlled path, then remove the model and award inventory.

Do not leave behind detached carrot roots, old leaves, or permanent visual debris unless that is an intentional gameplay feature.

The harvesting transition must not accidentally duplicate rewards.

## 12. Wheat — four distinct Blender growth stages

Wheat must no longer resemble random yellow sticks, simplified cylinders, or block-like grass.

It should communicate density, softness, wind movement, and agricultural maturity.

**Stage 1 — Seedling**

Create small green blades emerging from the soil.

A reference height is approximately 0.12 meters.

Use several carefully arranged thin blades.

Keep enough contrast against soil so players can recognize planted wheat.

Do not use unnaturally thick stalks.

**Stage 2 — Growing**

Represent the plant's tillering stage.

A reference height is approximately 0.35 meters.

Increase the number of slender stems and narrow leaves.

Introduce mild natural spread and irregularity.

Avoid uniformly vertical blades.

The plant should feel increasingly established without looking harvest-ready.

**Stage 3 — Maturing**

Create taller stalks with developing grain heads.

A reference height is approximately 0.65 meters.

Transition toward yellow-green colors.

Show emerging ears with identifiable structure.

Use believable stalk thickness.

Do not create excessively heavy wheat heads on tiny stems.

**Stage 4 — Harvest-ready**

Create mature golden wheat with full ears and carefully simplified awns.

The reference height is approximately 0.85 meters.

Use natural bends and slight variations in stalk height.

Avoid perfect symmetry.

The crop should look satisfying in groups, not just individually.

A mature wheat field should create an attractive, gently moving golden texture.

Be particularly careful with repeated geometry.

Do not create thousands of independent draw calls.

Design the wheat model and its rendering strategy for dense planting.

If several stalks make up one tile's plant, organize them as a compact cluster with appropriate geometry reuse.

Do not allow neighboring wheat tiles to overlap so heavily that they become visually indistinguishable or obscure all player feedback.

Implement gentle wind animation that is stronger near leaf tips and grain heads, while keeping the roots stationary.

Never sway the entire model from its center.

Wheat must appear rooted in the soil throughout movement.

Test wind at normal speed, paused or reduced simulation speed if supported, and during day/night transitions.

## 13. Pumpkins — four distinct Blender growth stages

Pumpkins are an important visual centerpiece of the fields.

They need distinctive segmented fruit, convincing vines, broad leaves, and a readable progression from seedling to harvest.

Avoid the current simplistic orange ball appearance.

**Stage 1 — Seedling**

Create two recognizable young cotyledon leaves and a short supporting stem.

A reference height is approximately 0.10 meters.

The seedling should be visibly different from carrot or wheat seedlings.

Use natural broad-leaf forms.

**Stage 2 — Growing**

Introduce spreading green vines.

Add larger, botanically appropriate leaves with natural angular lobes.

The previous design suggested a plant height near 0.25 meters.

Optionally include a small flower if it fits the stage.

Do not introduce a large pumpkin prematurely.

Ensure the vines remain within a sensible tile footprint.

**Stage 3 — Maturing**

Create a growing vine with broad leaves, branching stems, and a small immature green pumpkin.

The reference immature fruit diameter is approximately 0.40 meters, but verify whether that scale is appropriate for the game's one-meter planting grid.

The small pumpkin should visibly connect to its vine.

It must sit naturally on the soil rather than hanging unsupported in the air.

Check that leaves do not obscure the immature fruit completely.

**Stage 4 — Harvest-ready**

Create a beautiful mature pumpkin approximately 0.65 meters across, subject to scale verification.

The fruit should have clear ribbing and an organic shape.

Use subtle imperfections, variations in orange hue, surface roughness, and a distinctive thick stem.

Avoid a perfectly smooth, uniform sphere.

Add supporting vines and leaves without making the tile unreadably cluttered.

The pumpkin should visually rest on the soil.

Its contact area must be believable.

The fruit must not clip through the soil, sink below the surface, float above its roots, or intersect wooden field borders.

If the mature pumpkin occupies much of the tile, adjust leaf and vine distribution rather than arbitrarily moving the root to an adjacent tile.

During harvesting, ensure the fruit disappears cleanly and the appropriate crop-state transition occurs.

Do not leave a floating stem or detached vine.

Do not allow the old pumpkin model and the new Blender pumpkin model to render simultaneously.

## 14. Tomatoes — four distinct Blender growth stages

Tomato plants should be lush, structured, and visually recognizable.

They should include correct branching, meaningful foliage, small flowers, fruit clusters, and supporting stakes when appropriate.

Do not represent tomatoes as independent red balls floating above the soil.

**Stage 1 — Seedling**

Create a small delicate stem with characteristic young leaves.

Use a reference height around 0.12 meters.

Avoid oversizing the leaves.

Keep the model readable against the soil.

**Stage 2 — Growing**

Develop the main stem and a small branching structure.

The previous plan suggested a reference height around 0.45 meters.

Introduce appropriate leaves and a supporting stake or garden cane.

If the plant is attached to a stake, model believable ties or attachment points.

Do not allow the support to float above the ground.

Avoid oversized bamboo poles that dominate the field.

**Stage 3 — Maturing**

Create a fuller plant with branching foliage and immature green tomato clusters.

The reference height is approximately 0.80 meters.

The developing fruit must be attached to visible stems.

Use believable calyxes and cluster spacing.

Avoid positioning tomatoes at arbitrary world coordinates.

Keep the plant inside an appropriate footprint relative to its neighboring tiles.

**Stage 4 — Harvest-ready**

Create a lush plant approximately 0.95 meters tall.

Introduce mature red tomato clusters with subtle shape and color variation.

Include green calyxes and attachment stems.

Avoid perfectly identical tomato spheres.

Fruit should be readable from normal farming distance.

Do not overload the plant with enormous quantities of visible fruit.

Make the distribution attractive, plausible, and compatible with the intended harvest yield.

If the approved gameplay design uses continuous tomato harvesting, preserve the support and living plant when the fruit is harvested.

Only the harvested tomato clusters should visually disappear or transition into the appropriate regrowth state.

Fruit should regrow from valid attachment locations.

Do not reset or destroy the entire trellised plant unless the existing authoritative gameplay rules require it.

Verify that this behavior works after saving, loading, sleeping, and changing growth stages.

---

# PART V — CROP GROWTH AND ANIMATION QUALITY

## 15. Growth-stage transitions must appear physically grounded

This requirement is extremely important.

A previous apple-tree implementation produced floating fruit during regrowth. Do not repeat this class of bug.

The root attachment point of every crop must remain stable.

Growth animation should create the impression of a plant developing upward and outward from the soil.

It should not create the impression that the entire model is appearing in midair, descending from above, or being inflated from its center.

If scaling is used, apply it around the correct soil-level pivot.

If the visual stage changes by swapping models, ensure both models use compatible origins.

Do not animate a world-space offset that moves the plant above the tile.

Do not interpolate between arbitrary mesh centers.

For transitions between different stage geometries, consider a short crossfade, subtle scale-in of selected plant components, or another visually coherent treatment.

Do not use a dramatic bounce or elastic animation for every morning growth event.

A gentle organic easing curve is more appropriate.

Some stages may benefit from a brief leaf-unfolding or expanding visual.

For mature pumpkins, new fruit growth may be more convincing than scaling the whole vine.

For tomatoes, developing clusters should remain attached to stems.

For wheat, the stalks should lengthen naturally without their bases moving.

For carrots, foliage should grow while the visible crown remains at the soil.

Test intermediate animation frames, not only the beginning and end.

Capture frames at approximately 0%, 25%, 50%, 75%, and 100% of each representative transition.

Check for floating roots, popping geometry, sudden sideways movement, clipping, and duplicate visible stages.

Do not declare growth animation fixed after inspecting only a single static screenshot.

## 16. Growth timing and the day/night system

The current game has an established day/night and crop progression system.

Do not replace it with a new timer without necessity.

Inspect the authoritative growth-update mechanism.

Determine whether crops progress based on elapsed simulated time, day rollover, watering history, or explicit state transitions.

Use that existing authority.

The previous implementation plan referenced crop progression at morning rollover, including 06:00 and watered-day advancement.

Verify the actual code before implementing.

Visual growth events must not accidentally trigger additional gameplay growth.

A crop should not advance two stages because the player sleeps during the normal day rollover.

Ensure a single authoritative transition occurs for each eligible growth cycle.

The animation renderer should display state changes rather than independently decide when crops mature.

Do not allow an animation callback to write a second growth advancement.

If the game clock advances rapidly through sleeping, handle the resulting growth update deterministically.

If the game is paused, hidden, or reloaded, do not accumulate invalid animation deltas.

If a crop is harvested while a growth animation is active, cancel or resolve the animation cleanly.

If the same tile is replanted immediately, ensure old animation references cannot affect the new plant.

Avoid time-of-day dependencies that cause a crop to jump visually when crossing midnight.

Do not create gameplay exploits through rapid sleeping, repeated reloads, or interaction spam.

## 17. Crop lifecycle architecture and state isolation

Each farming tile should own or reference a clear logical crop state.

Rendering should derive from that state.

Do not allow visual instances to become the authoritative source of crop progression.

Use stable grid identifiers.

Ensure that each planted crop has a deterministically identifiable tile.

Avoid relying solely on the array position of an InstancedMesh entry as the permanent crop identity.

Instance indexes may change when crops are added, removed, harvested, or regrouped.

Maintain an explicit mapping from tile identifier to rendered instance information.

Validate every state transition.

Examples include empty soil to planted seedling, seedling to growing plant, developing crop to mature crop, mature crop to harvested soil, and regrowing tomato plant to another harvest-ready state.

Reject invalid transitions.

Prevent harvesting immature crops unless the existing game rules explicitly support it.

Prevent planting on occupied tiles.

Prevent watering empty locations incorrectly.

Prevent crop state from leaking between neighboring tiles.

Prevent changes to one tomato from modifying every tomato that shares the same geometry or material.

Shared assets must not imply shared mutable gameplay state.

Design test cases involving multiple crops at different stages simultaneously.

A carrot on one tile must not grow merely because nearby wheat advanced.

A harvested pumpkin must not disappear from every pumpkin tile.

The rendering system should remain correct regardless of whether crops are processed in insertion order, coordinate order, or instancing-group order.

---

# PART VI — COMPLETE FARMING SOIL RECONSTRUCTION

## 18. One authoritative farming-grid coordinate system

The game's farming grid must remain the single authority for crop and soil placement.

The prior Milestone A specification established one-meter cells and coordinate snapping.

Verify the current implementation and preserve it.

Do not add a separate Blender-defined grid that slowly diverges from gameplay coordinates.

Do not place soil assets using arbitrary hand-authored world positions.

Use an exact mapping from logical grid coordinates to world positions.

Every tile should have one predictable center.

Every crop should use that tile center unless the crop visual intentionally contains a small local variation.

A tilled cell should occupy its assigned space without covering adjacent cells unexpectedly.

Avoid inconsistent rounding rules.

Be especially careful with negative world coordinates.

Mathematically test snapping around cell boundaries, including values near zero and negative half-cell positions.

Do not introduce floating-point drift through repeated position conversions.

Do not apply a world transform twice.

If a crop is parented to the soil group, ensure its child coordinates remain local rather than accidentally using global positions.

Test rotated or scaled parent objects, if any exist.

Do not silently change the grid size to make Blender assets fit.

If the visual model is slightly oversized, adjust the model.

If the underlying grid is incorrect, demonstrate that with evidence before proposing any gameplay-level change.

## 19. Soil tile geometry must look natural and remain aligned

The existing soil needs a substantial visual improvement.

Avoid exaggerated raised slabs, circular mounds, cylindrical furrows, and log-like strips.

A tilled field should look like soil that has been loosened, turned, and lightly ridged.

Use a shallow profile.

The previous implementation used a one-meter tile and a shallow base with longitudinal furrows.

Preserve the established tile pitch.

A reusable Blender soil asset may introduce carefully modeled irregularities to the top surface.

However, these irregularities must not prevent adjacent tiles from meeting correctly.

Ensure tile boundaries remain geometrically compatible.

No visible cracks.

No overlapping borders.

No alternating heights.

No isolated raised end caps.

No random tiles tilted relative to the field.

Do not create an obvious checkerboard of repeated square chunks.

Keep the soil visual grounded against the surrounding meadow.

The transition from grass to tilled earth should look intentional.

Avoid enormous vertical walls at tile edges.

The soil should remain walkable without snagging the player.

If a visible shallow depression or furrow is added, do not automatically introduce a separate physical collision obstacle.

Use simplified and consistent ground collision.

Consider using reusable center, edge, corner, and transition visuals where necessary to prevent obvious seams.

Do not introduce an excessive number of geometry variants if a texture-based approach can achieve similar quality more efficiently.

## 20. Continuous field furrows and neighboring tiles

When a player tills adjacent cells, the field should appear connected.

Individual tile logic must remain intact, but the visual field should not look like unrelated square boxes.

Detect neighboring tilled cells.

Use their state to decide whether edge treatment is required.

Adjacent soil patches should connect without narrow green gaps unless those gaps are intentionally part of the design.

Longitudinal furrows should maintain a consistent direction.

Do not randomly rotate furrow models if that would break continuity.

If decorative surface variation is randomized, keep its boundaries compatible with neighboring tiles.

Avoid rendering duplicate edging between two neighboring tilled cells.

Avoid placing wooden boards around every single cell.

Large field borders belong at the farm-plot or field-edge level, not around every internal tile.

Test one isolated tile.

Test two adjacent tiles.

Test a straight row.

Test a square grid.

Test an irregular L-shaped tilled area.

Test tiles at the edge of a designated field.

Test a fully populated field containing crops at different stages.

The system must render all these cases without visible seams, z-fighting, overlapping geometry, or unexpected holes.

Do not assume a clean rectangular demonstration proves irregular tilled patches work.

## 21. Dry soil, watered soil, and visual moisture states

Dry soil and watered soil must look visibly different.

The difference should communicate gameplay state clearly without becoming cartoonishly extreme.

Dry soil should be lighter and slightly rougher.

It can include warm brown variation, small clumps, fine surface texture, and restrained dustiness.

Watered soil should become darker and slightly more saturated.

Add believable subtle highlights in suitable lighting.

Avoid making the watered field look like black paint, wet rubber, or a mirror.

Do not use uniform metallic gloss.

If roughness is reduced after watering, keep it physically reasonable.

Consider small temporary wet patches or subdued sheen in low points of the furrows.

Do not cover every watered tile in a perfectly flat reflective rectangle.

The underlying moisture state should drive the appearance.

Do not infer watering state from whether a material happens to look dark.

At morning rollover or whenever soil dries under the existing rules, update visual materials consistently.

Do not continue displaying watered soil after the gameplay state has become dry.

When restoring a save, display the correct soil state immediately.

Avoid flashing dry soil for a frame before applying the restored wet material.

Ensure shader uniforms or material instances do not cause one watered tile to turn every soil tile dark.

If shared materials are used, implement variation through suitable per-instance attributes, shader parameters, or controlled material groups.

Test mixed wet and dry tiles side by side.

## 22. Wooden field borders and agricultural construction

The wooden field borders should look like actual rural farm construction.

Create modular Blender assets for straight sections, corners, ends, posts, and appropriate joints.

Use natural timber proportions.

Include believable board thickness, subtle wood grain, mild weathering, and gentle irregularity.

Avoid perfectly identical broad rectangular bars with no material detail.

Avoid random mismatched board thicknesses.

Boards should align consistently at corners.

Adjacent sections should not visibly overlap.

Avoid gaps between posts and rails.

Avoid floating boards.

Avoid buried boards.

Avoid unsupported long spans.

Use decorative nails, joinery, braces, or small timber imperfections only when they meaningfully improve close-up appearance.

Do not create excessive geometry for details that would occupy only a few pixels.

Determine which borders are permanent plot structures and which are dynamically required by the farming state.

Do not build field borders that interfere with the player's ability to till, plant, water, or harvest.

Do not allow boards to obstruct the farming reticle incorrectly.

If borders are physically solid, their collision must match their real size and placement.

If the player is expected to step across low edging, use forgiving collision.

Do not introduce inaccessible soil cells because of decorative borders.

Keep the model compatible with future Milestone D fences and gates without replacing those future assets prematurely.

Ensure wood materials look cohesive with the farmhouse and other farm props.

## 23. Field composition and organic variation

A beautiful farm needs visual rhythm and controlled variety.

Do not build a perfectly uniform grid of identical crops with identical rotations and shading.

Introduce small deterministic variations in scale, orientation, leaf shape, and arrangement where appropriate.

These variations should improve naturalism while preserving gameplay clarity.

Do not randomly shift crop roots so far that plants appear to occupy adjacent tiles.

Do not allow pumpkins to clip through their neighboring crops because of excessive variation.

Use seeded randomness tied to stable tile identifiers so visual differences remain consistent after reload.

Avoid generating fresh random transformations every frame.

Avoid changing visual appearance unpredictably every time the player revisits the field.

For wheat, use modest variation in stalk arrangement and height.

For tomatoes, vary fruit-cluster placement while maintaining attachment correctness.

For carrots, vary leaf spread without changing the logical harvest location.

For pumpkins, vary fruit orientation, shape, and vine distribution within the allotted planting area.

Maintain distinct silhouettes at regular gameplay distance.

Do not make every crop lean in the same direction.

Do not over-randomize materials until the field looks visually noisy.

Allow small patches of earth to remain visible.

Keep rows readable.

Do not introduce weeds, pests, flowers, or new ground objects that affect gameplay unless those mechanics already exist.

Decorative elements should not silently alter farming probabilities, yields, or progression.

---

# PART VII — SHADERS, LIGHTING, AND ENVIRONMENTAL INTEGRATION

## 24. Wind animation for wheat and vegetation

Implement attractive, subtle wind behavior where appropriate.

Wheat is the primary candidate.

Some tomato and pumpkin leaves may also benefit from very restrained motion.

The wind must look like a natural environmental effect.

Avoid violent, synchronized oscillation.

Avoid every crop bending at exactly the same angle and time.

Use spatial phase variation or per-instance variation so adjacent plants sway differently.

Keep the plant roots anchored.

For wheat, allow the upper stalks and grain heads to move more than the base.

A vertex shader may be appropriate if it integrates cleanly with the existing material system.

Do not create an overly complicated custom shader that discards correct lighting, shadow mapping, fog, color management, or tone mapping.

Check compatibility with standard Three.js materials and the existing renderer.

If shader modification is required, preserve the relevant material chunks and uniform behavior.

Do not accidentally overwrite other shader hooks.

Do not recreate shader materials for each individual crop.

Avoid excessive CPU-side per-frame transforms for thousands of stalks.

Ensure the wind effect behaves sensibly when the frame rate varies.

Do not tie sway amplitude directly to uncontrolled frame delta.

Do not make crop movement speed change dramatically between 30 FPS and 120 FPS.

Test the effect with small fields and dense fields.

Verify that the crops remain visually rooted throughout the animation.

## 25. Day/night lighting integration

All new Blender crop and soil assets must work with the existing atmospheric lighting.

Do not redesign the sky or time system in Milestone C.

Use the current lighting architecture.

Check crops at early morning, midday, late afternoon, sunset, twilight, and night.

At midday, colors should be readable and natural.

During golden hour, wheat should catch attractive warm highlights.

Pumpkin ribs should remain distinguishable.

Tomatoes should retain recognizable red coloration without becoming excessively orange.

Carrot foliage should not merge into featureless dark green patches.

At night, avoid crops that are either pitch black or unnaturally self-illuminated.

If the project uses moonlight or ambient night illumination, integrate correctly.

Pay attention to color management.

Do not apply manual color correction to exported textures that causes double adjustment in Three.js.

Avoid excessive emissive properties for ordinary plant materials.

Ensure crop shadows are visually appropriate.

Small seedlings may not need expensive shadow casting.

Larger plants should contribute believable contact shadows where affordable.

Avoid hard, oversized silhouettes that make the fields look noisy.

Monitor shadow-map costs.

Do not allow crop visual improvements to break the established sunrise and sunset color transitions.

If screenshots reveal exposure or shading defects, investigate the material and light interaction before modifying global renderer settings.

## 26. Soil-contact realism and visual grounding

Every crop should visually belong to the earth beneath it.

This is more important than adding microscopic details.

A plant growing from soil needs a believable connection at its base.

Do not leave visible air gaps between the lowest stem and the ground.

Do not hide the entire lower stem beneath an overly thick soil surface.

Do not create floating shadows separated from the plant.

Do not place contact-shadow decals that remain after harvesting.

If the project uses different ground elevations, place crops relative to the correct local soil surface.

Do not assume world Y equals zero everywhere without verifying it.

If soil tiles are raised slightly to prevent z-fighting, account for that height consistently.

If nearby terrain is sloped, verify whether that plot is legally farmable before attempting to align the crop.

Do not rotate every crop automatically to match arbitrary terrain normals if doing so makes plants lean unnaturally.

A small amount of soil settling, roots emerging, or contact darkening can improve realism.

Keep such details subtle.

Check the same crop at several camera distances.

At close range, there must be no obvious separation.

At gameplay distance, the plant should read cleanly.

When harvested, remove or update soil-contact effects promptly.

When replanted, ensure a new plant does not inherit stale contact decorations from the previous crop.

---

# PART VIII — INTERACTION AND PLAYER EXPERIENCE

## 27. Planting interaction quality

Planting should feel deliberate, immediate, and understandable.

Preserve the existing tool hotbar and mouse controls.

Do not rebind fundamental inputs without approval.

When the player selects a seed and targets a valid empty tilled tile, provide clear visual feedback.

The reticle or highlight should indicate that planting is allowed.

When planting occurs, the seed count must decrease exactly once.

The crop state should be registered in the authoritative farming system.

The correct Stage 1 crop model should appear at the tile center.

Use a restrained planting animation.

A small soil disturbance and subtle particle burst may enhance the action.

Avoid giant explosions, exaggerated flashes, or unrelated effects.

If the target tile is invalid, show an accurate explanation.

Examples include untilled soil, occupied tile, invalid farming zone, blocked placement, or insufficient seeds.

Do not use one generic error for every failure when a meaningful reason is available.

Do not permit planting through walls or objects if the current interaction system forbids such actions.

Do not allow accidental planting behind the player.

Validate maximum interaction distance.

If the player clicks rapidly, prevent duplicate planting and negative seed counts.

Make visual and gameplay state update atomically enough that the player never sees a crop appear without inventory being updated.

Preserve tutorial progression and ensure it recognizes the new visuals.

## 28. Watering interaction quality

Watering should produce satisfying but believable visual feedback.

Retain the existing watering-can resource system.

Do not invent unlimited water.

When watering an eligible tile, validate the can's remaining contents.

Update the authoritative tile moisture state.

Only then update its visual appearance and associated effects.

Introduce subtle water particles or droplets if appropriate.

Droplets should travel in the expected direction from the watering action.

Avoid water effects that appear from the wrong location or follow the camera unnaturally.

Add a brief moistening transition rather than abruptly replacing the tile with an unrelated dark block.

Do not turn the soil into a reflective puddle unless standing water is actually part of the game's design.

Do not consume water twice if the animation event fires more than once.

Do not water adjacent tiles accidentally because the visual mesh extends beyond the logical tile.

Ensure the player's target is the logical cell, not an arbitrary triangle from a Blender model.

Verify that fully watered tiles behave according to existing rules.

Do not permit repeated watering to bypass growth requirements unless the current game design explicitly supports it.

Preserve the existing well-refill interaction from the completed environment systems.

Milestone C must not redesign or break the well itself.

## 29. Harvesting interaction quality

Harvesting should feel satisfying and responsive.

Mature crops should be easy to recognize.

Interaction prompts or reticle feedback should clearly indicate that the targeted crop is ready.

Retain the approved harvesting controls and tool requirements.

Do not suddenly require a different tool for existing crops unless the current game rules already distinguish them.

On valid harvest, award the correct inventory item and quantity exactly once.

Update the tile state according to the existing crop rules.

Trigger a short, tasteful harvest effect.

Appropriate effects may include a subtle leaf movement, dust puff, grain scattering, a controlled crop-lift motion, or a small visual disappearance transition.

Do not leave full-grown geometry after the crop has been collected.

Do not make the crop become harvestable again until its state legitimately permits it.

Test repeated clicks during the animation.

Test interaction spam.

Test harvesting immediately before saving.

Test harvesting immediately after loading.

Test harvesting while the world time is advancing.

Avoid duplicated inventory rewards from event listeners, overlapping colliders, animation callbacks, or repeated UI events.

Verify that harvested crops appear correctly in the inventory UI.

If item icons or item names already exist, preserve them unless their visual representation must be updated for consistency.

Do not silently change sell values, crop economics, or progression balance during a graphics milestone.

## 30. Tomato regrowth and repeat harvesting

The approved Milestone C roadmap includes continuous tomato regrowth.

Before implementing it, reconcile that proposal with the current crop-state machine.

Do not assume that the old system already supports it.

If the existing implementation uses a four-stage lifecycle where tomatoes disappear after harvesting, document the required extension.

Under the planned behavior, harvesting ripe tomatoes should collect the approved quantity while leaving the mature support structure and living vine intact.

The plant should enter a regrowth state.

The previous roadmap proposed returning the plant to a growing stage and producing another harvest after approximately three eligible growth days.

Confirm the intended watered-day and day-rollover semantics before coding.

The regrowth system must remain deterministic.

Fruit clusters should disappear from their original attachment locations.

Developing replacement tomatoes should appear on valid branch attachment anchors.

They must not materialize in midair.

Fruit must not grow outward from an incorrect pivot.

Do not scale the entire tomato plant down to imitate fruit regrowth.

Do not reset the plant's support stake.

Do not create a second overlapping tomato plant.

Ensure save data can represent the distinction between an initial growing plant and an established plant regrowing fruit.

Reloaded regrowth states must restore correctly.

Test repeated harvest cycles.

Verify that no duplicate rewards or premature growth transitions occur.

If implementing continuous regrowth requires altering the established save schema or crop API significantly, explain the change and obtain approval before introducing an incompatible design.

---

# PART IX — AUDIO, PARTICLES, AND VISUAL FEEDBACK

## 31. Tactile farming feedback

The farming system should feel satisfying without overwhelming the player.

Review existing procedural Web Audio and particle effects before adding new ones.

Reuse existing sound architecture.

Do not add a second competing audio manager.

Appropriate feedback includes a soft hoe impact, soil scattering, seed placement, gentle watering, foliage rustling, and a satisfying harvest cue.

Each effect should match the action.

Avoid overly loud or repetitive sounds.

Avoid playing multiple identical effects from one action.

Implement reasonable effect variation if supported by the existing audio system.

Do not introduce large external audio libraries merely for these effects.

Visual particles must be scaled appropriately.

Dust particles should emerge from the target soil region.

Water droplets should be spatially connected to watering.

Harvest particles should appear near the plant being harvested.

Do not create effects at the world origin because of incorrect transforms.

Avoid particles floating indefinitely.

Set particle lifetimes and cleanup correctly.

Do not create one permanent particle emitter per tile unless performance profiling justifies it.

Prefer pooled effect systems when repeated interactions would otherwise create excessive allocations.

Animations and sounds must not award items or mutate crop state independently.

Gameplay state remains authoritative.

Visual feedback should follow successful validated actions.

If an action fails, do not play the same satisfying effect as a successful action.

## 32. UI clarity and inspection feedback

The crop redesign should improve readability without cluttering the screen.

Inspect the existing farming tutorial, HUD, interaction messages, and crop indicators.

Preserve their established visual language.

Use the correct crop name and growth state.

If the planned crop-inspection card is implemented, it should show useful information rather than decorative filler.

Possible fields include crop name, growth stage, watering state, and a progress indicator.

Do not display an exact number of days to maturity unless the game state can calculate it reliably.

Do not invent progress percentages disconnected from underlying crop rules.

Avoid showing a crop as 100% ready before harvesting is actually permitted.

Keep the interface compact enough not to obstruct farming actions.

Avoid excessive animations or overlapping notifications.

Do not allow long warning text to hide the targeted tile.

Use consistent terminology across tooltip, inventory, tutorial, and gameplay messages.

Check readability against light farmland, dark soil, bright midday skies, and evening conditions.

Ensure invalid-action feedback explains the real problem.

Do not obscure the ability to distinguish seeded, watered, growing, and mature crop states.

Preserve keyboard and mouse controls.

Verify interaction prompts disappear when the player moves away.

Do not leave stale tooltip information after a crop is harvested or removed.

---

# PART X — RENDERING, INSTANCING, AND ASSET MANAGEMENT

## 33. Efficient repeated crop rendering

Farm fields may contain hundreds of repeated visual elements.

Design for scalability from the beginning.

Three.js InstancedMesh is a strong candidate for repeated crop stages.

However, do not use instancing blindly.

Inspect the number of material groups, meshes, geometries, and stage variants in the exported GLBs.

Instancing one high-level GLB scene does not automatically turn all its child meshes into a single draw call.

A crop model containing multiple submeshes or materials may still generate several draw calls per species and stage.

Measure the actual results.

Where beneficial, merge compatible static geometries in the asset pipeline or during Blender export.

Share geometry and materials across appropriate instances.

Keep animation and state isolated.

For each instancing group, maintain a reliable mapping from logical crop identifiers to instance slots.

Support planting new instances.

Support harvesting and removing instances.

Support stage transitions between instance groups.

Support tiles becoming empty.

Support crops being restored from save data.

Ensure the instance buffers are updated correctly.

Do not leave invisible stale geometry in a way that causes excessive memory usage or incorrect selection.

Use an efficient strategy for vacant instance slots.

Verify that frustum culling remains valid as instances are added or moved.

Check bounding volumes when using instanced geometry.

Do not allow an entire field to disappear unexpectedly because of incorrect bounds.

Do not render decorative crop geometry outside the actual field merely because an instance buffer was not initialized.

## 34. Shared materials and transform safety

Shared geometry can save significant GPU memory.

However, mutable material or transform state requires careful handling.

Do not modify a shared material's color in order to water one individual tile unless that behavior is intentionally shared.

Do not animate a shared crop root and accidentally move every instance of that crop.

Do not mutate geometry vertices at runtime if the geometry is reused across many unaffected instances.

Use appropriate per-instance color attributes, shader inputs, or separate material pools where necessary.

If stage models are cloned, understand which parts are deep copies and which parts remain shared references.

Avoid disposing of a shared geometry while other instances are still rendering it.

Avoid destroying shared textures during a single crop replacement.

Design explicit ownership and disposal rules.

When rebuilding the farm scene, detach old crop visuals and release only resources that are no longer referenced.

Do not accumulate duplicate loaded models after repeated saves, scene reloads, or development hot-reload events.

Inspect renderer memory telemetry before and after representative repeated farming actions.

Verify that material count, geometry count, and texture count do not grow without bound.

If caching is used, verify that asset requests reuse the cached template rather than reparsing the same GLB repeatedly.

Do not create a separate network request for every planted crop.

## 35. Performance and scalability requirements

Preserve the existing game's smooth responsiveness.

The earlier verified-plan report claimed approximately 101 FPS, about 915 draw calls, and roughly 58,000 triangles at its baseline commit.

Treat these as historical agent-reported measurements.

Re-measure the actual current Milestone B build before comparing.

Use the same browser, resolution, graphics settings, device, and representative camera viewpoints whenever possible.

Record baseline FPS and frame-time distribution.

Measure rendering draw calls.

Measure total triangles.

Measure geometry and texture allocations.

Measure asset loading time.

Inspect shader compilation and runtime stutter.

The established project ceiling is approximately 1,200 draw calls and 300,000 visible triangles, with a 60 FPS desktop performance objective.

The longer-term optimization goal is substantially lower than those ceilings, but do not treat a future target as an already achieved baseline.

The crop redesign must avoid unnecessary draw-call growth.

Do not sacrifice dramatically improved crop quality solely to meet an arbitrary single-frame triangle count.

Evaluate representative full-field conditions.

Test empty fields, partially planted fields, mature dense fields, and mixed-stage fields.

Use multiple camera positions.

Record performance under midday and evening lighting.

Check memory after repeated planting and harvesting.

Check one-percent-low FPS or frame-time spikes where tooling permits.

Do not report an estimated FPS as a measured result.

If a performance limit is exceeded, profile the cause before applying broad visual downgrades.

Prioritize geometry reuse, material sharing, batching, efficient particles, visibility control, and selective shadows.

Do not solve avoidable inefficiency by simply removing every visually interesting detail.

---

# PART XI — PERSISTENCE AND DATA INTEGRITY

## 36. Save system must remain backward compatible

The project has an established SaveManager and a reported schema version 2.

Preserve existing saved farms.

Do not wipe crop state.

Do not rename saved crop identifiers without migration logic.

Do not silently delete out-of-bounds legacy tiles.

The previously corrected Milestone A plan specifically requires restoring previously saved tiles even if new tilling is no longer allowed in those locations.

Respect that requirement.

The new visual models should be derivable from existing crop states wherever possible.

Avoid saving redundant mesh data, GLB scene graphs, temporary animation objects, shader instances, or renderer-specific instance indexes.

Persist authoritative gameplay state.

That includes crop type, logical tile location, progression stage, water state, and other genuinely necessary lifecycle information.

If tomato regrowth introduces additional state, design a backward-compatible default for older saves.

Ensure old saves load without crashes.

Ensure crops do not appear as the wrong species.

Ensure mature plants do not reset to seedlings.

Ensure watered soil does not appear dry after loading when its gameplay state is still wet.

Ensure a harvested crop does not instantly reappear without a legitimate state transition.

Ensure newly planted crops remain planted after reload.

Do not modify the semantics of the clock or daily growth counters accidentally.

If any migration is necessary, make it explicit, test it, and preserve the original save data until a successful migration is verified.

## 37. Determinism and recovery from interrupted actions

Test what happens when a user saves during an animation.

A partially growing crop should recover to a valid visual state.

A player saving during watering should not duplicate the resource cost.

A player saving immediately after harvest should not receive a second harvest on reload.

If a transition animation is purely cosmetic, it generally should not need its own persisted progress.

Instead, restore the authoritative gameplay state and present an appropriate stable model.

If intermediate animation persistence is genuinely required, provide a clear reason.

Test game refresh during planting.

Test game refresh during crop growth.

Test game refresh during tomato regrowth.

Test loading after a day rollover.

Test loading a mixed farm with many different growth stages.

Test loading a save created before Milestone C.

Test save corruption or missing optional properties using safe fallbacks.

Do not interpret missing state fields as permission to delete a saved farm.

Do not create a save migration that silently converts tomatoes into pumpkins or changes numeric crop identifiers.

Ensure stable visual variation after reload.

If seeded randomness is used, persist or deterministically reproduce the seed.

Avoid using renderer instance indexes as persistent identifiers.

---

# PART XII — DETAILED FAILURE PREVENTION

## 38. Prevent floating, buried, and misaligned crops

Explicitly test the following failure cases.

A plant appears above the soil because its Blender origin was placed at mesh center.

A crop sinks into the ground because the import offset was applied twice.

A Stage 2 plant jumps sideways because stage models have different object origins.

A pumpkin appears to float because its bounding sphere center was aligned instead of its ground-contact surface.

A tomato cluster becomes detached because the vine moved while the fruit remained in world space.

Wheat sway moves the root and creates visible gaps.

A crop inherits parent scaling from another scene object.

A shared animation transform affects multiple plants.

The scene's soil elevation changes while crop roots remain at their old height.

A field tile uses world Y while the crop uses local Y.

A crop is spawned at grid coordinates rather than the converted world coordinates.

Negative coordinates cause an off-by-one grid snap.

A harvested crop leaves old leaves behind.

A new crop renders together with an old crop that was not removed.

A crop is selected through another crop or structure because interaction targeting is inaccurate.

Inspect these cases visually and programmatically.

Do not claim that correct pivot naming alone proves correct placement.

Actually compare root locations against the soil surface in the running Three.js scene.

If a bug is detected, identify the transform or state relationship responsible rather than applying arbitrary numerical offsets until the screenshot looks acceptable.

## 39. Prevent soil, border, and field geometry defects

Test irregular tile groups, not just perfect demonstrations.

Prevent raised soil that resembles wooden logs.

Prevent visible square seams between adjacent tilled patches.

Prevent duplicated perimeter edging.

Prevent boards intersecting with mature pumpkins.

Prevent soil layers covering the bottom of plants unexpectedly.

Prevent furrows rotating unpredictably between neighboring cells.

Prevent textured surfaces flickering because of overlapping geometry.

Prevent wet and dry material states leaking between tiles.

Prevent a tilled tile visually extending across a path.

Prevent temporary preview meshes being included in exported assets.

Prevent permanent debug colliders appearing as black or colored objects.

Prevent floating field decorations.

Prevent decorative boards from introducing invisible walls in walkable areas.

Prevent soil patches from hiding interaction prompts.

Prevent crops from remaining selectable after harvesting.

Prevent field geometry from being rebuilt every frame.

Prevent duplicate event handlers when crop visuals reload.

Prevent large shader compilation pauses during the first watering or harvesting interaction.

Check edge cases involving a crop at the northernmost, southernmost, easternmost, and westernmost allowed cell of each arable zone.

Do not assume center-field tiles adequately represent boundary behavior.

## 40. Prevent visual inconsistency and repetitive appearance

Do not produce sixteen growth-stage models that are effectively the same mesh at different scales.

Each stage should introduce meaningful structural changes.

Do not use the same generic leaf geometry for carrots, pumpkins, and tomatoes without appropriate species-specific modifications.

Do not use identical green materials everywhere.

Do not create all mature wheat stalks at exactly the same height.

Do not create identical pumpkin ribbing on every instance.

Do not position every tomato cluster at the same angle.

Do not randomize leaf geometry so aggressively that botanical identity is lost.

Do not produce attractive isolated models that look poor when planted in a grid.

Test individual crop models and complete fields.

Test close-up appearance and gameplay-distance appearance.

Test crops against the actual farmhouse, apple trees, grass, soil, and mountain background.

Avoid a crop art style that is much more photorealistic or much more cartoonish than the rest of Meadow Valley.

Do not use excessive highlights to fake detail.

Use strong silhouettes, intentional proportions, material variation, and carefully placed geometric detail.

Every visual difference should support readability or beauty.

## 41. Prevent new gameplay bugs while changing visuals

Do not change the authoritative crop-state machine without documenting the reason.

Do not introduce new input bindings unnecessarily.

Do not accidentally make crops harvestable at all stages.

Do not allow planting without seeds.

Do not accidentally consume seeds when planting fails.

Do not allow crops to be planted on roads or house surfaces.

Do not bypass Milestone A farming restrictions.

Do not make crop geometry physically block walking unless specifically required by approved gameplay.

Do not make wooden field borders trap the player.

Do not accidentally reset inventory when rebuilding the farm renderer.

Do not introduce a second crop growth timer.

Do not let crop visuals control the game clock.

Do not duplicate crop rewards through animation events.

Do not lose regrowth state on reload.

Do not let save restoration place visual models at incorrect world positions.

Do not overwrite legacy crop values with new assumptions.

Do not change crop economy or balancing without approval.

Do not interfere with the farmhouse sleeping mechanic.

Do not break the existing water-refill interaction.

Do not break apple harvesting or the Blender orchard.

Do not modify unrelated collision boundaries or player movement during crop rendering changes.

Treat all these as explicit regression risks.

---

# PART XIII — IMPLEMENTATION STRATEGY AND CHECKPOINTS

## 42. Stage C0 — Repository audit and detailed implementation plan

Begin with a read-only audit.

Document the current crop lifecycle, farm grid, model structure, existing tests, and rendering architecture.

Produce a concise technical design showing how Blender assets will attach to the authoritative tile system.

Explain whether four GLBs, sixteen GLBs, or another organization is best.

Define the material workflow.

Define the instancing strategy.

Define the growth-stage mapping.

Explain the shader and animation approach.

Explain how a planted crop will move from Stage 1 through Stage 4.

Explain how harvest and tomato regrowth will work.

Explain the moisture material architecture.

Describe field-border geometry and tile adjacency handling.

Identify required code changes.

Identify risks.

Provide performance budgets and acceptance tests.

Do not begin mass production of models during this audit.

If Milestone B still has unresolved defects, stop and report that Milestone C's prerequisite has not been met.

If the repository is not clean, stop and identify the uncommitted work.

## 43. Stage C1 — Controlled Blender proof of concept

After the audit, produce a small representative visual prototype.

Create:

1. One complete carrot model family showing all four growth stages.
2. One premium one-meter soil tile.
3. Dry and watered soil material variations.
4. A small connected group of tilled cells.
5. A short, grounded growth-stage transition.

Import these assets into the actual game.

Use an isolated test region or controlled test setup that will not corrupt existing farm saves.

The prototype must demonstrate correct model origins, tile alignment, appropriate field scale, and a clear visual improvement over the old procedural assets.

Capture the carrot stages side by side.

Capture a tilled three-by-three field.

Capture dry and watered states.

Capture the crop at intermediate growth-animation frames.

Capture normal gameplay-distance screenshots.

Show the result in midday and sunset lighting.

Measure draw calls and asset size.

Provide evidence that planting, watering, and harvesting still work.

**Stop after C1 and wait for my visual approval before authoring and deploying all remaining crop models.**

If the prototype looks too basic, improve it before expanding.

Do not use a low-quality carrot prototype as the template for the entire milestone.

## 44. Stage C2 — Complete all crop assets

After approval of the visual prototype, finish the approved four-stage asset families for carrots, wheat, pumpkins, and tomatoes.

Reuse the validated scale, origin, naming, export, and material conventions.

Do not blindly copy the same geometry from species to species.

Inspect every growth stage in Blender before export.

Inspect every stage in the actual Three.js environment.

Prepare a comparative asset sheet or screenshot collection.

Check whether Stage 1 and Stage 2 remain clearly distinguishable.

Check whether Stage 3 and Stage 4 demonstrate recognizable maturity.

Inspect the color transition of wheat.

Inspect the attachment and scale of pumpkins.

Inspect tomato stems and fruit clusters.

Ensure all species meet the approved art direction.

Run asset validation before proceeding to full renderer integration.

Do not hide failed exports behind automatic procedural fallbacks and report the asset as successfully loaded.

A fallback may keep the game running, but a failed Blender asset must still be reported as a failed asset.

## 45. Stage C3 — Integrate the crop renderer

Replace old procedural crop visuals through a controlled integration.

Keep gameplay state independent of mesh instances.

Implement or extend a crop-rendering manager only when it is architecturally justified.

Use the existing asset pipeline.

Avoid duplicate GLB loading.

Avoid redundant material creation.

Maintain deterministic tile-to-instance mapping.

Ensure new crop visuals are shown at the correct locations and stages.

Implement stage transitions and wind effects.

Test one crop type before activating all four.

Test mixed fields before replacing every visible crop.

Verify that mature pumpkin and tomato geometry does not create unacceptable collisions or clipping.

Verify that growth and harvest events update the correct visual elements.

Retain a safe fallback strategy during integration.

Do not leave legacy procedural crops and new Blender crops rendering simultaneously.

Do not remove the fallback until the replacement has passed the full acceptance checks.

## 46. Stage C4 — Field and soil reconstruction

Once crop rendering is stable, complete the farmland visual system.

Introduce the approved soil tile model, material variations, shallow furrows, and connected tile rendering.

Integrate wooden field borders and appropriate transition pieces.

Keep the one-meter logical grid unchanged.

Ensure tilling creates a clean visual transition from grass to soil.

Ensure watering changes the correct tile appearance.

Ensure soil dries according to the existing gameplay system.

Ensure crops remain centered and grounded.

Check all six previously designated farming zones against the actual current configuration.

Do not assume the six-zone registry is already data-driven unless verified.

Preserve the existing arable-zone rules.

Test irregular tilled patterns and plot boundaries.

Measure performance after field visual changes.

Avoid replacing the entire game terrain with an enormous Blender mesh as part of this milestone.

## 47. Stage C5 — Interaction, animation, and visual feedback polish

After the crop and soil systems are stable, polish their interactions.

Refine planting animation.

Refine watering feedback.

Refine harvest effects.

Refine growth transitions.

Refine subtle wheat movement.

Add or adjust tool audio through the existing audio system.

Improve crop-ready visual feedback.

Ensure different crops remain recognizable through the complete lifecycle.

Remove debug geometry and unused placeholders.

Inspect camera-distance transitions.

Tune the effects so farming feels responsive and satisfying, not noisy or exaggerated.

Test rapid interaction sequences.

Check that visual animation is never responsible for issuing duplicate gameplay changes.

Verify that feedback corresponds to authoritative success or failure.

Do not prematurely redesign unrelated HUD systems.

## 48. Stage C6 — Full verification and repair

Run the full existing automated test suite.

Add targeted Milestone C tests.

Inspect the running browser game manually.

Capture both 1920×1080 and 1440×900 screenshots.

Verify crop models at several growth stages and field densities.

Check the actual visual results against the approved C1 prototype.

Inspect frame-time behavior under dense planting.

Test saves and reloads.

Test tomato regrowth if it is part of the approved implementation.

Test dry and watered soil.

Test farming-zone boundaries.

Test crop rendering at negative world coordinates.

Test field-edge geometry.

Test planting, watering, and harvesting interactions.

Test day rollover and farmhouse sleeping.

Fix all critical regressions.

Do not declare the milestone complete while collision, save, harvest, or growth bugs remain.

Only then prepare the final milestone report.

---

# PART XIV — AUTOMATED AND MANUAL TEST SPECIFICATIONS

## 49. Mandatory automated test coverage

Create an appropriate Milestone C verification suite using the project's existing testing conventions.

Do not assume that a new test filename proves test coverage.

Tests must inspect meaningful behavior.

At minimum, cover crop registration, asset loading, valid planting, invalid planting, stage progression, watering state changes, harvest eligibility, inventory updates, persistence, and visual instance mapping.

Include tests ensuring that the correct Blender asset is associated with the correct crop species.

Verify that each crop can display four distinct stages.

Verify stage changes maintain stable tile coordinates.

Verify planted instances disappear or update appropriately on harvest.

Verify invalid planting does not consume seeds.

Verify valid harvesting awards inventory exactly once.

Verify watering modifies only the intended tile.

Verify legacy tile restoration.

Verify tomato regrowth rules if implemented.

Verify rendering groups do not accidentally share mutable state.

Verify asset caching prevents duplicate parsing.

Verify cleanup avoids growing GPU resource counts under repeated lifecycle actions.

Test a representative full-field render.

Use browser interaction tests where unit tests cannot reliably establish behavior.

Do not write superficial tests that always pass because they only check whether a function exists.

For each test group, explain which failure it is intended to detect.

## 50. Mandatory manual gameplay scenarios

Execute actual gameplay scenarios in the running game.

Scenario 1: Start with an empty valid field, till one tile, plant a carrot, water it, advance growth, and harvest.

Scenario 2: Plant carrot, wheat, pumpkin, and tomato on adjacent valid cells and verify their visuals remain distinct.

Scenario 3: Till a three-by-three area and inspect tile alignment from above and from player eye level.

Scenario 4: Plant at the edge of an arable zone and attempt planting immediately outside the permitted area.

Scenario 5: Water alternate cells in a field and confirm only those cells darken.

Scenario 6: Sleep in the farmhouse and verify each eligible crop advances exactly once.

Scenario 7: Save a mixed-growth field, reload, and confirm visual and logical state match.

Scenario 8: Harvest mature crops while clicking repeatedly and confirm no duplication.

Scenario 9: Plant new crops after harvesting old crops and confirm old meshes are removed.

Scenario 10: Harvest a tomato, test regrowth, then save and reload during the regrowth process.

Scenario 11: Fill a dense wheat field and inspect wind movement and frame rate.

Scenario 12: Inspect mature pumpkins near field borders for clipping.

Scenario 13: Walk around and across field edges and ensure decorative structures do not trap the player.

Scenario 14: Inspect plants at midday, sunset, twilight, and night.

Scenario 15: Verify the farmhouse, apple orchard, inventory, save system, and mountain boundaries remain unaffected.

A test is not passed merely because a screenshot looks correct.

Observe the required action and resulting gameplay state.

## 51. Required screenshot and visual-inspection package

Capture high-quality screenshots from the actual running Three.js game.

Do not present only Blender viewport renders as proof of successful integration.

Produce clearly named evidence covering:

- Old-versus-new carrot model comparison.
- Old-versus-new wheat model comparison.
- Old-versus-new pumpkin model comparison.
- Old-versus-new tomato model comparison.
- A four-stage sheet for each crop species.
- Full field showing all four species together.
- Close-up of soil and plant attachment points.
- Dry versus watered soil.
- One isolated tilled tile.
- Connected three-by-three tilled field.
- Irregular field shape.
- Wooden field-edge construction.
- Early crop-growth transition.
- Mid-transition growth state.
- Mature harvest-ready crops.
- Wheat wind animation evidence.
- Tomato regrowth evidence.
- Midday field overview.
- Golden-hour field overview.
- Nighttime field overview.
- Dense-field performance view.

Use the previously established capture resolutions of 1920×1080 and 1440×900 where practical.

Keep comparable camera positions and lighting for old-versus-new comparisons.

Do not manipulate screenshots to hide missing geometry or performance issues.

Where a defect is difficult to demonstrate with still screenshots, provide a concise test trace, recorded state sequence, or reproducible browser interaction evidence.

## 52. Visual acceptance scorecard

Evaluate the results using a consistent visual scorecard.

Score each category on a scale of 0 to 3.

The categories are:

1. Crop silhouette and recognizable species identity.
2. Growth-stage differentiation.
3. Organic modeling and believable plant anatomy.
4. Material richness and natural color variation.
5. Soil geometry and furrow quality.
6. Dry/wet soil visual communication.
7. Field continuity and wooden edging.
8. Correct crop grounding and animation.
9. Planting, watering, and harvesting presentation.
10. Day/night integration.
11. Performance and stability.
12. Cohesion with the approved rest of the world.

Use evidence-based scoring.

Do not automatically give every asset a perfect score.

Explain meaningful deductions.

Aim for at least 2.5 out of 3 in every category, with stronger targets in crop identity, visual grounding, and farming interaction correctness.

Any floating plants, unusable farming tiles, duplicated rewards, broken save states, or major regressions are blocking defects regardless of the average visual score.

Visual scoring is not a replacement for gameplay tests.

## 53. Severity classification and repair requirements

Classify discovered issues by severity.

**Critical:** Save corruption, lost inventory, duplicated rewards, broken planting, broken crop progression, incorrect crop identity, crashes, or widespread invalid farming behavior.

Critical issues must be resolved before milestone approval.

**High:** Floating plants, incorrect growth animation, severe visual clipping, broken wet/dry rendering, major field seams, unusable bordering tiles, or significant performance regressions.

High-severity issues must be resolved before milestone approval.

**Medium:** Noticeable geometry imperfections, material inconsistency, awkward but functional effects, excessive repetition, minor scene composition problems, or isolated animation roughness.

Medium issues should be repaired during the polish pass or explicitly recorded for review.

**Low:** Small cosmetic inconsistencies, negligible details only visible at extreme zoom, or optional refinements outside the approved quality threshold.

Low issues may be documented without blocking completion if the core milestone quality remains strong.

Do not close issues merely by changing their severity labels.

Do not call an unresolved issue fixed without validating it.

Provide evidence for corrected defects.

---

# PART XV — FINAL QUALITY AND RELEASE REQUIREMENTS

## 54. Mandatory final regression checks

Before requesting approval, run the relevant previous milestone tests again.

Milestone C must not regress Milestone A's farming boundaries and collision behavior.

Milestone C must not regress Milestone B's farmhouse, interactions, sleeping, or storage.

Milestone C must not regress the orchard harvesting and fruit-regrowth system.

Test save compatibility.

Test inventory state.

Test game clock integration.

Test player movement around fields.

Test the farming tutorial.

Test dynamic asset loading.

Test the production build.

Test browser startup and scene loading from a clean session.

Check the browser console for runtime errors, missing GLB assets, material warnings, shader compilation problems, and uncaught exceptions.

Check that the game remains playable if an optional visual effect fails.

Do not suppress errors merely to produce a clean console.

Investigate all relevant warnings.

Verify that temporary testing utilities do not remain enabled in production unintentionally.

Verify that no stray Blender object, collision proxy, camera, helper mesh, or debug placeholder appears in the world.

Verify resource cleanup.

Verify that model files and editable Blender sources are stored in the intended project locations.

## 55. Deliverable requirements

At the end of Milestone C, provide a complete implementation report containing:

**Repository status**
- Current branch and commit.
- Safe checkpoint reference.
- Files modified.
- Files added.
- Any unresolved working-tree changes.

**Asset inventory**
- Blender source filenames.
- Runtime GLB filenames.
- Number of completed crop models.
- Number of growth stages per species.
- Soil and field-border asset inventory.
- File sizes.
- Triangle counts.
- Material and draw-call implications.

**Gameplay implementation**
- How crop states map to visual stages.
- How growth animations maintain ground attachment.
- How wet/dry soil updates.
- How planting and harvesting work.
- How tomato regrowth works, if implemented.
- How legacy saves remain compatible.

**Visual evidence**
- Required screenshots.
- Old-versus-new comparisons.
- Lighting comparisons.
- Full-field screenshots.
- Growth-animation evidence.

**Performance**
- Baseline and final FPS.
- Average and low-end frame-time metrics where measurable.
- Draw calls.
- Triangles.
- Geometry and texture memory.
- Asset load times.
- Any performance changes attributable to the new system.

**Validation**
- Exact commands executed.
- Automated test results.
- Manual test results.
- Known failures.
- Remaining issues.
- Severity of unresolved issues.

Do not fabricate measurements or screenshots.

If some measurement cannot be obtained, identify the limitation accurately.

## 56. Final approval gate

Milestone C should not be considered completed until all of the following are true.

The four approved crop species have visually distinct growth stages.

The models are correctly integrated through the Blender asset pipeline.

Crop origins and pivots are correct.

No crop appears to float, sink, or detach from its planting location.

Soil cells remain aligned to the authoritative grid.

Adjacent tilled cells appear visually continuous.

Dry and watered soil are easy to distinguish.

Wooden field borders look believable and do not obstruct normal gameplay.

Planting, watering, growth, and harvesting function correctly.

Crop state remains independent between tiles.

The save system restores crops and soil accurately.

Any approved tomato regrowth behavior works reliably.

The existing farmhouse, orchard, tutorial, and day/night features still function.

The browser game starts without new runtime errors.

Performance remains acceptable under representative dense-field conditions.

The new visuals meet the established quality standard.

All critical and high-severity defects are resolved.

The full verification report and requested screenshots are available for review.

Do not automatically proceed to Milestone D.

Do not begin Blender modeling for the well, fences, gates, walking roads, or scarecrow as part of Milestone C.

Do not begin the mountain or cloud reconstruction.

Do not silently expand the task because another feature seems convenient to improve.

Stop and wait for my evaluation and approval.

---

# PART XVI — FINAL EXECUTION INSTRUCTIONS

## 57. Important principles to follow throughout development

Treat this milestone as both a visual redesign and a gameplay integration project.

A Blender model is not successful merely because it looks good in Blender.

A soil texture is not successful merely because it appears dark after watering.

A growth animation is not successful merely because the first and last frames are correctly positioned.

A harvest effect is not successful merely because the player hears a sound.

A test suite is not successful merely because every assertion reports PASS.

Every system must be evaluated in the context of actual gameplay.

Use careful, incremental implementation.

Preserve the functionality already developed.

Inspect real geometry and real gameplay behavior.

Avoid unnecessary architecture rewrites.

Create distinctive, visually compelling crop species.

Build satisfying growth progression.

Make the farmland look cohesive and natural.

Keep the technical systems deterministic and testable.

Use Blender where it genuinely increases asset quality.

Use Three.js where it provides reliable rendering, interactions, state management, and animations.

Profile rather than guess.

Investigate rather than hide bugs.

Verify rather than assume.

Do not make promises that zero bugs can ever occur. Instead, actively search for likely defects, test edge cases, fix discovered problems, and clearly disclose anything that remains unresolved.

## 58. What I want you to do first

When this prompt is submitted, confirm that Milestone B has been approved and that the project is in an appropriate state to begin Milestone C.

Then perform the C0 repository audit.

Use Planning mode to produce a practical implementation plan for the crop and farmland redesign.

The plan must use the actual current source code and the installed skills.

Show how the crop model hierarchy, growth-state representation, soil materials, tile alignment, renderer instancing, animation anchors, and persistence will work together.

Identify any differences between this master specification and the current game.

Do not silently change established gameplay rules to resolve those differences.

After I approve the technical plan, create the C1 carrot-and-soil visual prototype using the live Blender MCP connection.

Demonstrate the prototype in the running game.

Capture real screenshots and provide measured performance data.

Stop for my approval before producing the entire remaining asset library.

Once the prototype is approved, execute the subsequent Milestone C stages in the agreed order.

Complete all tests and quality gates.

Preserve the completed work from Milestones A and B.

Do not start Milestone D.

**The final objective is a beautiful, grounded, responsive, performant farming system that looks substantially more advanced than the existing procedural version and remains completely playable.**

**Begin with verification and planning, not uncontrolled implementation.**
</USER_REQUEST>
<ADDITIONAL_METADATA>
The current local time is: 2026-10-11T12:10:58+06:00.
</ADDITIONAL_METADATA>