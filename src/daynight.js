import * as THREE from 'three';
import { events } from './events.js';

/**
 * Keyframe definitions across the 24-hour cycle.
 * Specifically tuned to satisfy the refined atmosphere requirements:
 * - 06:30 Sunrise: Warm peach horizon + cooler blue upper sky, subtle dawn mist, long directional shadows
 * - 08:00 Morning: Warm buttery light (distinct from 12:00), longer shadows, fresh morning air
 * - 12:00 Midday: Crisp daylight, natural blue gradient sky, neutral sun (preserved)
 * - 17:00 Golden Hour: Low-angle warm sunlight, rich golden highlights on buildings & crops, long soft shadows
 * - 18:30 Sunset: Layered gradient (orange/gold near horizon, subtle salmon mid-sky, violet/blue upper sky; NO FLAT PINK)
 * - 19:30 Twilight: Cool atmosphere with reduced blue ground cast; glowing windows stand out
 * - 22:30 Night: Deep midnight navy with subtle stars, soft moonlight, and cozy visibility (preserved)
 */
const KEYFRAMES = [
  // 04:00 - Deep Pre-Dawn Night
  {
    hour: 4.0,
    sunX: 180,
    sunY: -45,
    sunZ: -10,
    sunIntensity: 0.0,
    sunColor: 0xffa055,
    moonIntensity: 0.44,
    moonColor: 0x93c5fd,
    hemiSky: 0x18233c,
    hemiGround: 0x090e18,
    hemiIntensity: 0.40,
    ambientColor: 0x1e293b,
    ambientIntensity: 0.35,
    fogColor: 0x0f172a,      // Deep midnight slate
    fogDensity: 0.0032,
    skyZenith: 0x020617,     // Cosmic obsidian
    skyMid: 0x0b1329,        // Midnight navy
    skyLow: 0x151c33,        // Deep slate navy
    skyHorizon: 0x1e293b,    // Midnight horizon rim
    cloudColor: 0x0f172a,    // Silhouette clouds
    cloudOpacity: 0.38,
    starOpacity: 0.95,
    windowGlow: 0.98,
    lanternIntensity: 1.65,
    exposure: 0.96
  },

  // 05:30 - Early Dawn Light
  {
    hour: 5.5,
    sunX: 180,
    sunY: 0,
    sunZ: -10,
    sunIntensity: 0.35,
    sunColor: 0xf97316,
    moonIntensity: 0.15,
    moonColor: 0x93c5fd,
    hemiSky: 0x312e81,
    hemiGround: 0x1e293b,
    hemiIntensity: 0.52,
    ambientColor: 0x4338ca,
    ambientIntensity: 0.30,
    fogColor: 0x475569,      // Lavender-slate dawn mist
    fogDensity: 0.0044,
    skyZenith: 0x0f172a,
    skyMid: 0x1e1b4b,
    skyLow: 0x4338ca,
    skyHorizon: 0xf43f5e,    // Rose-coral dawn horizon
    cloudColor: 0x64748b,
    cloudOpacity: 0.65,
    starOpacity: 0.55,
    windowGlow: 0.70,
    lanternIntensity: 1.15,
    exposure: 1.00
  },

  // 06:30 - Sunrise (Warm Peach Horizon + Cooler Blue Upper Sky, Dawn Mist & Long Directional Shadows)
  {
    hour: 6.5,
    sunX: 178,
    sunY: 14,
    sunZ: -12,
    sunIntensity: 1.30,
    sunColor: 0xffa055,      // Warm peach sunrise sun
    moonIntensity: 0.0,
    moonColor: 0x93c5fd,
    hemiSky: 0x3b82f6,       // Cooler morning sky bounce
    hemiGround: 0x65a30d,    // Fresh morning grass
    hemiIntensity: 0.72,
    ambientColor: 0xfed7aa,  // Warm peach ambient fill
    ambientIntensity: 0.26,
    fogColor: 0xfed7aa,      // Warm golden apricot morning mist
    fogDensity: 0.0050,      // Subtle dawn mist near the ground
    skyZenith: 0x1e3a8a,     // Cooler deep blue upper sky
    skyMid: 0x38bdf8,        // Clean morning azure mid sky
    skyLow: 0x60a5fa,        // Transition azure band
    skyHorizon: 0xfdba74,    // Radiant warm golden peach / apricot horizon
    cloudColor: 0xfed7aa,    // Sunrise illuminated clouds
    cloudOpacity: 0.88,
    starOpacity: 0.0,
    windowGlow: 0.20,
    lanternIntensity: 0.20,
    exposure: 1.08
  },

  // 08:00 - Morning (Warm Buttery Gold, Distinct from Noon, Medium-Long Shadows & Fresh Valley Air)
  {
    hour: 8.0,
    sunX: 158,
    sunY: 52,
    sunZ: -25,
    sunIntensity: 1.45,
    sunColor: 0xfde68a,      // Noticeably warmer buttery light than noon
    moonIntensity: 0.0,
    moonColor: 0x93c5fd,
    hemiSky: 0x7dd3fc,       // Fresh sky blue
    hemiGround: 0x4ade80,    // Fresh morning green
    hemiIntensity: 0.86,
    ambientColor: 0xfef9c3,  // Warm soft light fill
    ambientIntensity: 0.27,
    fogColor: 0xdbeafe,      // Fresh alpine morning mist
    fogDensity: 0.0036,      // Clean fresh valley air
    skyZenith: 0x1d4ed8,     // Royal blue
    skyMid: 0x38bdf8,        // Clean morning blue
    skyLow: 0x93c5fd,        // Azure haze
    skyHorizon: 0xfef08a,    // Buttery gold horizon band
    cloudColor: 0xfffbeb,    // Warm creamy white clouds
    cloudOpacity: 0.94,
    starOpacity: 0.0,
    windowGlow: 0.08,
    lanternIntensity: 0.0,
    exposure: 1.06
  },

  // 12:00 - Midday (Crisp Daylight & Clean Blue Sky - Preserved)
  {
    hour: 12.0,
    sunX: 10,
    sunY: 155,
    sunZ: -45,
    sunIntensity: 1.55,
    sunColor: 0xfffef4,      // Neutral crisp midday sunlight
    moonIntensity: 0.0,
    moonColor: 0x93c5fd,
    hemiSky: 0x7dd3fc,       // High sky blue
    hemiGround: 0x16a34a,    // True meadow green
    hemiIntensity: 0.95,
    ambientColor: 0xffffff,  // Clean white ambient fill
    ambientIntensity: 0.25,
    fogColor: 0xbae6fd,      // Crisp alpine mountain haze
    fogDensity: 0.0028,      // Cleanest clarity for distant ranges
    skyZenith: 0x1e40af,     // Deep zenith blue
    skyMid: 0x38bdf8,        // Clean sky blue
    skyLow: 0x7dd3fc,        // Alpine light blue
    skyHorizon: 0xbae6fd,    // Natural clear horizon haze
    cloudColor: 0xffffff,    // Pure fluffy white clouds
    cloudOpacity: 0.96,
    starOpacity: 0.0,
    windowGlow: 0.05,
    lanternIntensity: 0.0,
    exposure: 1.04
  },

  // 15:30 - Late Afternoon Transition
  {
    hour: 15.5,
    sunX: -125,
    sunY: 85,
    sunZ: -30,
    sunIntensity: 1.48,
    sunColor: 0xfef08a,
    moonIntensity: 0.0,
    moonColor: 0x93c5fd,
    hemiSky: 0x60a5fa,
    hemiGround: 0x22c55e,
    hemiIntensity: 0.88,
    ambientColor: 0xfef9c3,
    ambientIntensity: 0.26,
    fogColor: 0xcbe3fb,
    fogDensity: 0.0032,
    skyZenith: 0x1d4ed8,
    skyMid: 0x3b82f6,
    skyLow: 0x93c5fd,
    skyHorizon: 0xfef08a,
    cloudColor: 0xfffbeb,
    cloudOpacity: 0.94,
    starOpacity: 0.0,
    windowGlow: 0.10,
    lanternIntensity: 0.05,
    exposure: 1.06
  },

  // 17:00 - Golden Hour (Low-Angle Warm Sunlight, Rich Golden Highlights, Long Soft Shadows)
  {
    hour: 17.0,
    sunX: -168,
    sunY: 28,
    sunZ: -18,
    sunIntensity: 1.55,      // Strengthened low-angle warm sunlight
    sunColor: 0xf59e0b,      // Rich deep golden amber
    moonIntensity: 0.0,
    moonColor: 0x93c5fd,
    hemiSky: 0x3b82f6,       // Cooler sky bounce above
    hemiGround: 0x84cc16,    // Warm golden-lit grass bounce
    hemiIntensity: 0.80,
    ambientColor: 0xfde68a,  // Warm golden ambient fill
    ambientIntensity: 0.30,
    fogColor: 0xfed7aa,      // Warm amber mountain haze
    fogDensity: 0.0035,
    skyZenith: 0x1e3a8a,     // Cooler deep cobalt upper sky
    skyMid: 0x2563eb,        // Deepening azure
    skyLow: 0xf59e0b,        // Warm amber band
    skyHorizon: 0xfbbf24,    // Radiant glowing golden horizon (warmer near horizon!)
    cloudColor: 0xfde047,    // Richly sunlit golden clouds
    cloudOpacity: 0.92,
    starOpacity: 0.0,
    windowGlow: 0.35,
    lanternIntensity: 0.35,
    exposure: 1.15           // Rich golden highlights on farmhouse, crops, cobbles
  },

  // 18:30 - Sunset (Layered Gradient: Orange/Gold Horizon, Salmon Mid-Sky, Violet Upper Sky, NO FLAT PINK!)
  {
    hour: 18.5,
    sunX: -176,
    sunY: 13,
    sunZ: -10,
    sunIntensity: 1.18,      // Low sunset ember above mountain rim
    sunColor: 0xea580c,      // Rich sunset amber-orange
    moonIntensity: 0.0,
    moonColor: 0x93c5fd,
    hemiSky: 0x3730a3,       // Deep indigo-violet upper sky bounce
    hemiGround: 0x78350f,    // Warm earth bounce
    hemiIntensity: 0.68,
    ambientColor: 0xfed7aa,  // Warm peach-amber ambient (reduced pink saturation!)
    ambientIntensity: 0.30,
    fogColor: 0xfdba74,      // Warm sunset amber-peach mist (NOT HOT PINK!)
    fogDensity: 0.0040,
    skyZenith: 0x1e1b4b,     // Deep violet-blue upper sky
    skyMid: 0x2e3875,        // Dusky violet/indigo
    skyLow: 0xc06c84,        // Subtle, natural dusty salmon/rose band
    skyHorizon: 0xf97316,    // Vibrant glowing orange / gold / peach horizon
    cloudColor: 0xfba368,    // Layered sunset clouds with natural peach-coral tops
    cloudOpacity: 0.86,
    starOpacity: 0.20,       // Early evening stars
    windowGlow: 0.82,        // Chalet windows glowing warmly
    lanternIntensity: 1.35,  // Porch lantern ignited
    exposure: 1.10           // Cinematic, warm, but natural
  },

  // 19:30 - Twilight (Dusty Violet / Lavender Slate, Reduced Blue Cast on Ground, Windows Stand Out!)
  {
    hour: 19.5,
    sunX: -180,
    sunY: -8,
    sunZ: -5,
    sunIntensity: 0.05,
    sunColor: 0x9a3412,
    moonIntensity: 0.30,
    moonColor: 0x93c5fd,
    hemiSky: 0x312e81,       // Dusky twilight purple
    hemiGround: 0x1e293b,    // Muted slate earth (REDUCED BLUE CAST!)
    hemiIntensity: 0.50,
    ambientColor: 0x3b4252,  // Neutral slate ambient fill (REDUCED BLUE CAST!)
    ambientIntensity: 0.34,
    fogColor: 0x475569,      // Dusty violet / slate twilight fog
    fogDensity: 0.0036,
    skyZenith: 0x0f172a,     // Deep slate navy
    skyMid: 0x312e81,        // Dusky indigo
    skyLow: 0x475569,        // Dusty slate band
    skyHorizon: 0x6b7280,    // Dusty lavender slate horizon rim
    cloudColor: 0x475569,    // Dusky twilight silhouette clouds
    cloudOpacity: 0.65,
    starOpacity: 0.72,       // Stars sparkling across twilight sky
    windowGlow: 0.98,        // Farmhouse windows POP OUT brightly!
    lanternIntensity: 1.65,  // Warm beacon on porch
    exposure: 1.02
  },

  // 21:00 - Night Settling
  {
    hour: 21.0,
    sunX: -120,
    sunY: -45,
    sunZ: 10,
    sunIntensity: 0.0,
    sunColor: 0x9a3412,
    moonIntensity: 0.42,
    moonColor: 0x93c5fd,
    hemiSky: 0x1e293b,
    hemiGround: 0x0f172a,
    hemiIntensity: 0.45,
    ambientColor: 0x1e293b,
    ambientIntensity: 0.36,
    fogColor: 0x1e293b,      // Deep slate navy
    fogDensity: 0.0032,
    skyZenith: 0x030712,
    skyMid: 0x0f172a,
    skyLow: 0x1e293b,
    skyHorizon: 0x1e3a8a,    // Deep midnight blue horizon
    cloudColor: 0x1e293b,
    cloudOpacity: 0.48,
    starOpacity: 0.90,
    windowGlow: 0.96,
    lanternIntensity: 1.65,
    exposure: 0.98
  },

  // 22:30 - Night (Deep Midnight Navy - Preserved)
  {
    hour: 22.5,
    sunX: 0,
    sunY: -80,
    sunZ: 20,
    sunIntensity: 0.0,
    sunColor: 0x9a3412,
    moonIntensity: 0.46,
    moonColor: 0x93c5fd,     // Cool silvery blue moonlight
    hemiSky: 0x172554,       // Deep navy sky fill
    hemiGround: 0x0a0f1d,    // Dark ground
    hemiIntensity: 0.42,
    ambientColor: 0x1e293b,  // Cozy ambient visibility fill
    ambientIntensity: 0.36,
    fogColor: 0x0f172a,      // Midnight navy fog (clean silhouettes)
    fogDensity: 0.0030,
    skyZenith: 0x020617,     // Deepest midnight obsidian
    skyMid: 0x090d16,        // Dark celestial navy
    skyLow: 0x0f172a,        // Midnight indigo
    skyHorizon: 0x172554,    // Deep midnight blue horizon rim
    cloudColor: 0x0f172a,    // Dark translucent silhouettes
    cloudOpacity: 0.40,
    starOpacity: 0.98,       // Full twinkling starfield
    windowGlow: 0.98,        // Chalet windows glowing cozy gold
    lanternIntensity: 1.65,  // Porch lantern burning warmly
    exposure: 0.96
  }
];

export class DayNightCycle {
  constructor(scene, timeManager, world, renderer = null) {
    this.scene = scene;
    this.time = timeManager;
    this.world = world;
    this.renderer = renderer;

    // Lights
    this.sunLight = null;
    this.moonLight = null;
    this.hemiLight = null;
    this.ambientLight = null;
    this.sunMesh = null;
    this.moonMesh = null;

    // Sky & Stars
    this.skyDome = null;
    this.skyCanvas = null;
    this.skyCtx = null;
    this.skyTexture = null;
    this.starField = null;
    this.starMaterial = null;

    // Emissive and lighting targets
    this.windowMaterial = world ? world.materials.windowWarm : null;
    this.lanternLight = world ? world.lanternLight : null;
    this.cloudMaterial = world ? world.cloudMaterial : null;

    // Reusable objects for interpolation
    this.scratchState = {
      sunPos: new THREE.Vector3(),
      moonPos: new THREE.Vector3(),
      sunColor: new THREE.Color(),
      moonColor: new THREE.Color(),
      hemiSky: new THREE.Color(),
      hemiGround: new THREE.Color(),
      ambientColor: new THREE.Color(),
      fogColor: new THREE.Color(),
      skyZenith: new THREE.Color(),
      skyMid: new THREE.Color(),
      skyLow: new THREE.Color(),
      skyHorizon: new THREE.Color(),
      cloudColor: new THREE.Color(),
      sunIntensity: 0,
      moonIntensity: 0,
      hemiIntensity: 0,
      ambientIntensity: 0,
      fogDensity: 0.0035,
      cloudOpacity: 0.9,
      starOpacity: 0,
      windowGlow: 0,
      lanternIntensity: 0,
      exposure: 1.05
    };

    this.c1 = new THREE.Color();
    this.c2 = new THREE.Color();

    this.initLightingAndSky();

    // Listen for time ticks
    events.on('time:tick', () => this.update());
  }

  initLightingAndSky() {
    // 1. Directional Sun Light with tuned shadow frustum
    this.sunLight = new THREE.DirectionalLight(0xfff8e7, 1.48);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 5;
    this.sunLight.shadow.camera.far = 400;
    const d = 75;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.bias = -0.0004;

    this.sunLight.target = new THREE.Object3D();
    this.sunLight.target.position.set(0, 0, -10);
    this.scene.add(this.sunLight.target);
    this.scene.add(this.sunLight);

    // 2. Directional Moon Light with soft cool fill
    this.moonLight = new THREE.DirectionalLight(0x93c5fd, 0.45);
    this.moonLight.castShadow = true;
    this.moonLight.shadow.mapSize.width = 1024;
    this.moonLight.shadow.mapSize.height = 1024;
    this.moonLight.shadow.camera.near = 5;
    this.moonLight.shadow.camera.far = 400;
    this.moonLight.shadow.camera.left = -d;
    this.moonLight.shadow.camera.right = d;
    this.moonLight.shadow.camera.top = d;
    this.moonLight.shadow.camera.bottom = -d;
    this.moonLight.shadow.bias = -0.0004;

    this.moonLight.target = new THREE.Object3D();
    this.moonLight.target.position.set(0, 0, -10);
    this.scene.add(this.moonLight.target);
    this.scene.add(this.moonLight);

    // 3. Hemisphere Bounce Light
    this.hemiLight = new THREE.HemisphereLight(0x93c5fd, 0x48bb78, 0.85);
    this.scene.add(this.hemiLight);

    // 4. Ambient Fill Light
    this.ambientLight = new THREE.AmbientLight(0xfffbeb, 0.25);
    this.scene.add(this.ambientLight);

    // 5. Sun and Moon Celestial Spheres
    this.sunMesh = new THREE.Mesh(
      new THREE.SphereGeometry(12, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xfffbeb, fog: false })
    );
    this.scene.add(this.sunMesh);

    this.moonMesh = new THREE.Mesh(
      new THREE.SphereGeometry(9, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xe0f2fe, fog: false })
    );
    this.scene.add(this.moonMesh);

    // 6. Dynamic Sky Canvas with True Spherical Horizon Mapping
    this.skyCanvas = document.createElement('canvas');
    this.skyCanvas.width = 2;
    this.skyCanvas.height = 512;
    this.skyCtx = this.skyCanvas.getContext('2d');
    this.skyTexture = new THREE.CanvasTexture(this.skyCanvas);

    const skyGeo = new THREE.SphereGeometry(360, 32, 24);
    skyGeo.scale(-1, 1, 1);
    const skyMat = new THREE.MeshBasicMaterial({
      map: this.skyTexture,
      side: THREE.BackSide,
      fog: false
    });
    this.skyDome = new THREE.Mesh(skyGeo, skyMat);
    this.scene.add(this.skyDome);

    // 7. Star Field (Upper hemisphere distribution)
    const starCount = 750;
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 340;

      const y = Math.abs(r * Math.cos(phi)) + 12;
      const x = r * Math.sin(phi) * Math.cos(theta);
      const z = r * Math.sin(phi) * Math.sin(theta);

      starPositions[i * 3] = x;
      starPositions[i * 3 + 1] = y;
      starPositions[i * 3 + 2] = z;
    }

    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    this.starMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 2.2,
      transparent: true,
      opacity: 0.0,
      fog: false
    });
    this.starField = new THREE.Points(starGeo, this.starMaterial);
    this.scene.add(this.starField);

    // Initial update
    this.update();
  }

  /**
   * Sample interpolated atmospheric state for any decimal hour [0, 24)
   * @param {number} hour 
   */
  sampleAtmosphere(hour) {
    let normHour = hour % 24;
    if (normHour < 0) normHour += 24;

    let prev = KEYFRAMES[KEYFRAMES.length - 1];
    let next = KEYFRAMES[0];

    for (let i = 0; i < KEYFRAMES.length; i++) {
      if (KEYFRAMES[i].hour <= normHour) {
        prev = KEYFRAMES[i];
        next = KEYFRAMES[(i + 1) % KEYFRAMES.length];
      } else {
        break;
      }
    }

    let span = next.hour - prev.hour;
    if (span < 0) span += 24;
    let elapsed = normHour - prev.hour;
    if (elapsed < 0) elapsed += 24;

    const rawT = span === 0 ? 0 : elapsed / span;
    // Smoothstep interpolation for soft filmic transitions
    const t = rawT * rawT * (3 - 2 * rawT);

    const lerpColor = (target, hexA, hexB) => {
      this.c1.setHex(hexA);
      this.c2.setHex(hexB);
      target.copy(this.c1).lerp(this.c2, t);
    };

    const s = this.scratchState;
    // Interpolate sun coordinate trajectory
    s.sunPos.set(
      THREE.MathUtils.lerp(prev.sunX, next.sunX, t),
      THREE.MathUtils.lerp(prev.sunY, next.sunY, t),
      THREE.MathUtils.lerp(prev.sunZ, next.sunZ, t)
    );
    // Moon is opposite on the celestial dome
    s.moonPos.set(-s.sunPos.x, Math.max(15, -s.sunPos.y * 1.1), -s.sunPos.z);

    lerpColor(s.sunColor, prev.sunColor, next.sunColor);
    lerpColor(s.moonColor, prev.moonColor, next.moonColor);
    lerpColor(s.hemiSky, prev.hemiSky, next.hemiSky);
    lerpColor(s.hemiGround, prev.hemiGround, next.hemiGround);
    lerpColor(s.ambientColor, prev.ambientColor, next.ambientColor);
    lerpColor(s.fogColor, prev.fogColor, next.fogColor);
    lerpColor(s.skyZenith, prev.skyZenith, next.skyZenith);
    lerpColor(s.skyMid, prev.skyMid, next.skyMid);
    lerpColor(s.skyLow, prev.skyLow, next.skyLow);
    lerpColor(s.skyHorizon, prev.skyHorizon, next.skyHorizon);
    lerpColor(s.cloudColor, prev.cloudColor, next.cloudColor);

    s.sunIntensity = THREE.MathUtils.lerp(prev.sunIntensity, next.sunIntensity, t);
    s.moonIntensity = THREE.MathUtils.lerp(prev.moonIntensity, next.moonIntensity, t);
    s.hemiIntensity = THREE.MathUtils.lerp(prev.hemiIntensity, next.hemiIntensity, t);
    s.ambientIntensity = THREE.MathUtils.lerp(prev.ambientIntensity, next.ambientIntensity, t);
    s.fogDensity = THREE.MathUtils.lerp(prev.fogDensity, next.fogDensity, t);
    s.cloudOpacity = THREE.MathUtils.lerp(prev.cloudOpacity, next.cloudOpacity, t);
    s.starOpacity = THREE.MathUtils.lerp(prev.starOpacity, next.starOpacity, t);
    s.windowGlow = THREE.MathUtils.lerp(prev.windowGlow, next.windowGlow, t);
    s.lanternIntensity = THREE.MathUtils.lerp(prev.lanternIntensity, next.lanternIntensity, t);
    s.exposure = THREE.MathUtils.lerp(prev.exposure, next.exposure, t);

    return s;
  }

  /**
   * Updates lighting, shadows, sky canvas, fog, and materials based on current in-game time
   */
  update() {
    const hour = this.time.hour + this.time.minute / 60 + (this.time.second || 0) / 3600;

    // 1. Interpolate Complete Atmospheric State
    const state = this.sampleAtmosphere(hour);

    // 2. Position Sun and Moon with accurate directional shadow coordinates
    this.sunLight.position.copy(state.sunPos);
    this.sunMesh.position.set(state.sunPos.x * 1.3, state.sunPos.y * 1.3, state.sunPos.z * 1.3);

    this.moonLight.position.copy(state.moonPos);
    this.moonMesh.position.set(state.moonPos.x * 1.3, state.moonPos.y * 1.3, state.moonPos.z * 1.3);

    // 3. Directional Sun & Moon Lights
    this.sunLight.intensity = state.sunIntensity;
    this.sunLight.color.copy(state.sunColor);
    this.sunLight.castShadow = (state.sunIntensity > 0.05);
    this.sunMesh.visible = (state.sunPos.y > -8 && state.sunIntensity > 0.05);

    this.moonLight.intensity = state.moonIntensity;
    this.moonLight.color.copy(state.moonColor);
    this.moonLight.castShadow = (state.moonIntensity > 0.05);
    this.moonMesh.visible = (state.moonPos.y > -8 && state.moonIntensity > 0.05);

    // 4. Hemisphere & Ambient Lights
    this.hemiLight.color.copy(state.hemiSky);
    this.hemiLight.groundColor.copy(state.hemiGround);
    this.hemiLight.intensity = state.hemiIntensity;

    this.ambientLight.color.copy(state.ambientColor);
    this.ambientLight.intensity = state.ambientIntensity;

    // 5. Dynamic Fog Synchronization (matches horizon to eliminate unnatural color wash)
    if (this.scene.fog) {
      this.scene.fog.color.copy(state.fogColor);
      this.scene.fog.density = state.fogDensity;
    }
    if (this.scene.background) {
      this.scene.background.copy(state.fogColor);
    }

    // 6. Dynamic Cloud Synchronization
    if (this.world && this.world.cloudMaterial) {
      this.world.cloudMaterial.color.copy(state.cloudColor);
      this.world.cloudMaterial.opacity = state.cloudOpacity;
    }

    // 7. Dynamic Star Field Opacity with Subtle Night Twinkling
    if (this.starMaterial) {
      const twinkle = state.starOpacity > 0.4 ? 0.96 + Math.sin(Date.now() * 0.004) * 0.04 : 1.0;
      this.starMaterial.opacity = THREE.MathUtils.clamp(state.starOpacity * twinkle, 0, 1);
    }

    // 8. Chalet Windows Warm Emissive Glow
    if (this.windowMaterial) {
      this.windowMaterial.emissiveIntensity = state.windowGlow;
    }

    // 9. Porch Lantern Warm Flame Flicker
    if (this.lanternLight) {
      const flicker = state.lanternIntensity > 0.2 ? 1.0 + Math.sin(Date.now() * 0.007) * 0.12 : 1.0;
      this.lanternLight.intensity = state.lanternIntensity * flicker;
    }

    // 10. Filmic Exposure
    if (this.renderer) {
      this.renderer.toneMappingExposure = state.exposure;
    }

    // 11. Render Sky Dome Canvas Gradient
    this.updateSkyGradient(state);
  }

  /**
   * Repaint sky canvas gradient with accurate spherical horizon mapping.
   * SphereGeometry UV mapping:
   * v = 1.0 (line 0 in canvas) = Top pole (Zenith)
   * v = 0.5 (line 256 in canvas) = Equator (True Horizon)
   * v = 0.0 (line 512 in canvas) = Bottom pole (Nadir)
   * @param {Object} state 
   */
  updateSkyGradient(state) {
    if (!this.skyCtx) return;

    const ctx = this.skyCtx;
    const grad = ctx.createLinearGradient(0, 0, 0, 512);

    // Mapped precisely so the visible sky receives a smooth layered gradient
    grad.addColorStop(0.00, state.skyZenith.getStyle());
    grad.addColorStop(0.20, state.skyMid.getStyle());
    grad.addColorStop(0.35, state.skyLow.getStyle());
    grad.addColorStop(0.48, state.skyHorizon.getStyle());
    grad.addColorStop(0.51, state.skyHorizon.getStyle());
    grad.addColorStop(0.55, state.fogColor.getStyle());
    grad.addColorStop(1.00, state.fogColor.getStyle());

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 2, 512);

    if (this.skyTexture) {
      this.skyTexture.needsUpdate = true;
    }
  }
}
