import * as THREE from 'three';
import { sounds } from './audio.js';

/**
 * Shortest signed angular difference between two angles in [-PI, PI]
 */
function angleDiff(from, to) {
  let diff = (to - from + Math.PI) % (Math.PI * 2);
  if (diff < 0) diff += Math.PI * 2;
  return diff - Math.PI;
}

/**
 * Smoothly interpolate between two angles in radians
 */
function lerpAngle(from, to, t) {
  return from + angleDiff(from, to) * Math.min(1, Math.max(0, t));
}

/**
 * Reusable articulated 3D Farm Worker NPC with procedural animations,
 * terrain-aligned foot grounding, paddock-gate-aware waypoint navigation,
 * local obstacle avoidance, stuck recovery, and player interaction.
 */
export class FarmWorker {
  constructor(scene, world, collisionWorld, config = {}) {
    this.scene = scene;
    this.world = world;
    this.collisionWorld = collisionWorld;

    this.id = config.id || 'worker_caleb';
    this.name = config.name || 'Caleb';
    this.role = config.role || 'Farm Worker';
    this.radius = config.radius || 0.42;
    this.height = config.height || 1.78;
    this.walkSpeed = config.walkSpeed || 2.35;
    this.turnSpeed = config.turnSpeed || 7.2;

    // World position & orientation (yaw = 0 faces +Z in local mesh space)
    const startX = config.x !== undefined ? config.x : 1.6;
    const startZ = config.z !== undefined ? config.z : -19.5;
    const startY = this.getTerrainHeight(startX, startZ);

    this.position = new THREE.Vector3(startX, startY, startZ);
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.yaw = config.yaw !== undefined ? config.yaw : 0; // 0 = facing South (+Z) down Main Avenue
    this.targetYaw = this.yaw;
    this.headYaw = 0;
    this.headPitch = 0;

    // Animation state
    this.state = 'idle'; // 'idle' | 'walking' | 'talking'
    this.walkPhase = 0;
    this.moveBlend = 0;
    this.idleLookTimer = 1.8;
    this.desiredHeadYaw = 0;
    this.desiredHeadPitch = 0;
    this.waveTimer = 0;
    this.talkPauseTimer = 0;
    this.blinkTimer = 2.4;
    this.isBlinking = false;

    // Navigation & Patrol state
    this.patrolWaypoints = config.waypoints || this.createDefaultPatrolRoute();
    this.currentWaypointIndex = 0;
    this.activePathQueue = []; // Expanded sub-waypoints (including gate approaches & sidesteps)
    this.pauseTimer = 1.5;     // Brief initial greeting pause near farmhouse

    // Stuck detection & recovery
    this.stuckSampleTimer = 0;
    this.lastProgressPos = this.position.clone();
    this.stuckCount = 0;
    this.sidestepDir = 1;

    // Friendly dialogue lines when player presses E
    this.dialogueLines = [
      '👋 Caleb: "Mornin\'! The soil in Meadow Valley is looking mighty fine today."',
      '🌾 Caleb: "Just making my rounds past the carrot and pumpkin paddocks!"',
      '💧 Caleb: "Don\'t forget to top off your watering can at the stone well."',
      '🌻 Caleb: "Nothing beats a crisp mountain breeze and honest farm work!"',
      '🥕 Caleb: "Give the word whenever you need an extra pair of hands on the farm!"'
    ];
    this.dialogueIndex = 0;

    // Build articulated 3D character hierarchy
    this.group = new THREE.Group();
    this.group.name = `NPC_${this.name}`;
    this.group.position.copy(this.position);
    this.group.rotation.y = this.yaw;

    this.buildCharacterMesh();
    this.scene.add(this.group);

    // Seed initial navigation leg
    this.queuePathToCurrentPatrolStop();
  }

  /**
   * Constructs Caleb as an articulated, stylized 3D character:
   * - Straw sun hat with woven band & wheat stem accent
   * - Expressive head with eyes, pupils, catchlights, eyebrows, nose, ears, hair tufts & warm smile
   * - Rolled-sleeve burnt-orange work shirt
   * - Blue denim overalls with front bib, shoulder straps, brass buttons & chest pocket
   * - Articulated upper/lower arms with hands and upper/lower legs with rugged leather work boots
   */
  buildCharacterMesh() {
    this.bodyRoot = new THREE.Group();
    this.bodyRoot.name = 'bodyRoot';
    this.group.add(this.bodyRoot);

    const mats = {
      skin: new THREE.MeshStandardMaterial({ color: 0xe8ac7e, roughness: 0.65 }),
      skinBlush: new THREE.MeshStandardMaterial({ color: 0xd97b66, roughness: 0.7 }),
      hair: new THREE.MeshStandardMaterial({ color: 0x4a2c18, roughness: 0.82 }),
      eyeWhite: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.25 }),
      eyeIris: new THREE.MeshStandardMaterial({ color: 0x5c3a21, roughness: 0.3 }),
      eyePupil: new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.2 }),
      shirtOrange: new THREE.MeshStandardMaterial({ color: 0xea6815, roughness: 0.78 }),
      shirtCuff: new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.75 }),
      denim: new THREE.MeshStandardMaterial({ color: 0x23538a, roughness: 0.86 }),
      denimDark: new THREE.MeshStandardMaterial({ color: 0x1b4270, roughness: 0.88 }),
      denimCuff: new THREE.MeshStandardMaterial({ color: 0x6088b8, roughness: 0.82 }),
      brass: new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.32, metalness: 0.65 }),
      bootLeather: new THREE.MeshStandardMaterial({ color: 0x4a2a14, roughness: 0.72 }),
      bootSole: new THREE.MeshStandardMaterial({ color: 0x1f140d, roughness: 0.92 }),
      strawHat: new THREE.MeshStandardMaterial({ color: 0xe7c163, roughness: 0.78 }),
      strawRim: new THREE.MeshStandardMaterial({ color: 0xd4a94a, roughness: 0.82 }),
      hatBand: new THREE.MeshStandardMaterial({ color: 0x6b3410, roughness: 0.85 }),
      kerchief: new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.8 })
    };

    const enableShadows = (mesh) => {
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      return mesh;
    };

    // =========================================================================
    // 1. ARTICULATED LEGS & WORK BOOTS (Hip pivots at Y = 0.78m, boots touch Y = 0.00m)
    // =========================================================================
    const createLegAssembly = (side) => {
      const hipPivot = new THREE.Group();
      hipPivot.position.set(side * 0.115, 0.78, 0);

      // Rounded hip joint
      const hipJoint = enableShadows(new THREE.Mesh(
        new THREE.SphereGeometry(0.095, 10, 8),
        mats.denim
      ));
      hipPivot.add(hipJoint);

      // Upper thigh (denim overall trousers)
      const thigh = enableShadows(new THREE.Mesh(
        new THREE.CylinderGeometry(0.098, 0.086, 0.36, 10),
        mats.denim
      ));
      thigh.position.set(0, -0.18, 0);
      hipPivot.add(thigh);

      // Knee pivot at Y = -0.36m relative to hip (world Y = 0.42m)
      const shinPivot = new THREE.Group();
      shinPivot.position.set(0, -0.36, 0);
      hipPivot.add(shinPivot);

      const kneeJoint = enableShadows(new THREE.Mesh(
        new THREE.SphereGeometry(0.082, 10, 8),
        mats.denimDark
      ));
      shinPivot.add(kneeJoint);

      // Lower leg / shin (denim)
      const shin = enableShadows(new THREE.Mesh(
        new THREE.CylinderGeometry(0.084, 0.076, 0.26, 10),
        mats.denim
      ));
      shin.position.set(0, -0.13, 0);
      shinPivot.add(shin);

      // Rolled denim cuff above boot
      const cuff = enableShadows(new THREE.Mesh(
        new THREE.CylinderGeometry(0.088, 0.088, 0.055, 10),
        mats.denimCuff
      ));
      cuff.position.set(0, -0.245, 0);
      shinPivot.add(cuff);

      // Work Boot assembly (bottom of sole sits at exact Y = -0.42m in shin space -> Y = 0.00m world)
      const bootGroup = new THREE.Group();
      bootGroup.position.set(0, -0.42, 0);
      shinPivot.add(bootGroup);

      // Boot ankle shaft
      const bootShaft = enableShadows(new THREE.Mesh(
        new THREE.CylinderGeometry(0.078, 0.082, 0.14, 10),
        mats.bootLeather
      ));
      bootShaft.position.set(0, 0.11, 0);
      bootGroup.add(bootShaft);

      // Boot vamp & rounded toe box extending forward (+Z)
      const bootBody = enableShadows(new THREE.Mesh(
        new THREE.BoxGeometry(0.155, 0.085, 0.23),
        mats.bootLeather
      ));
      bootBody.position.set(0, 0.068, 0.032);
      bootGroup.add(bootBody);

      const bootToe = enableShadows(new THREE.Mesh(
        new THREE.SphereGeometry(0.076, 10, 8),
        mats.bootLeather
      ));
      bootToe.scale.set(1.0, 0.65, 1.15);
      bootToe.position.set(0, 0.062, 0.125);
      bootGroup.add(bootToe);

      // Thick dark lugged sole (bottom at Y = 0.00m)
      const bootSole = enableShadows(new THREE.Mesh(
        new THREE.BoxGeometry(0.165, 0.028, 0.265),
        mats.bootSole
      ));
      bootSole.position.set(0, 0.014, 0.035);
      bootGroup.add(bootSole);

      return { hipPivot, shinPivot };
    };

    const leftLeg = createLegAssembly(-1);
    const rightLeg = createLegAssembly(1);
    this.leftLegPivot = leftLeg.hipPivot;
    this.leftShinPivot = leftLeg.shinPivot;
    this.rightLegPivot = rightLeg.hipPivot;
    this.rightShinPivot = rightLeg.shinPivot;
    this.bodyRoot.add(this.leftLegPivot);
    this.bodyRoot.add(this.rightLegPivot);

    // =========================================================================
    // 2. PELVIS, TORSO, ORANGE WORK SHIRT & BLUE DENIM OVERALLS (Pivot at Y = 0.78m)
    // =========================================================================
    this.torsoPivot = new THREE.Group();
    this.torsoPivot.position.set(0, 0.78, 0);
    this.bodyRoot.add(this.torsoPivot);

    // Overalls waist / pelvis basin
    const pelvis = enableShadows(new THREE.Mesh(
      new THREE.CylinderGeometry(0.215, 0.205, 0.17, 12),
      mats.denim
    ));
    pelvis.scale.set(1.05, 1.0, 0.78);
    pelvis.position.set(0, 0.05, 0);
    this.torsoPivot.add(pelvis);

    // Denim waist belt seam
    const waistBand = enableShadows(new THREE.Mesh(
      new THREE.CylinderGeometry(0.222, 0.220, 0.045, 12),
      mats.denimDark
    ));
    waistBand.scale.set(1.05, 1.0, 0.79);
    waistBand.position.set(0, 0.125, 0);
    this.torsoPivot.add(waistBand);

    // Burnt-Orange Work Shirt Torso
    this.chestGroup = new THREE.Group();
    this.chestGroup.position.set(0, 0.14, 0);
    this.torsoPivot.add(this.chestGroup);

    const shirtTorso = enableShadows(new THREE.Mesh(
      new THREE.CylinderGeometry(0.225, 0.208, 0.42, 12),
      mats.shirtOrange
    ));
    shirtTorso.scale.set(1.08, 1.0, 0.78);
    shirtTorso.position.set(0, 0.20, 0);
    this.chestGroup.add(shirtTorso);

    // Rounded shoulder yoke
    const shoulderYoke = enableShadows(new THREE.Mesh(
      new THREE.SphereGeometry(0.225, 12, 8),
      mats.shirtOrange
    ));
    shoulderYoke.scale.set(1.12, 0.42, 0.76);
    shoulderYoke.position.set(0, 0.39, 0);
    this.chestGroup.add(shoulderYoke);

    // Rustic red neckband / collar trim
    const collarRing = enableShadows(new THREE.Mesh(
      new THREE.TorusGeometry(0.105, 0.024, 8, 14),
      mats.kerchief
    ));
    collarRing.rotation.x = Math.PI / 2 + 0.12;
    collarRing.position.set(0, 0.425, 0.015);
    this.chestGroup.add(collarRing);

    // Blue Denim Overalls Front Bib
    const frontBib = enableShadows(new THREE.Mesh(
      new THREE.BoxGeometry(0.28, 0.29, 0.045),
      mats.denim
    ));
    frontBib.position.set(0, 0.14, 0.158);
    frontBib.rotation.x = -0.04;
    this.chestGroup.add(frontBib);

    // Stitched center bib pocket
    const bibPocket = enableShadows(new THREE.Mesh(
      new THREE.BoxGeometry(0.15, 0.12, 0.025),
      mats.denimDark
    ));
    bibPocket.position.set(0, 0.14, 0.18);
    this.chestGroup.add(bibPocket);

    // Back overalls panel
    const backBib = enableShadows(new THREE.Mesh(
      new THREE.BoxGeometry(0.26, 0.26, 0.04),
      mats.denim
    ));
    backBib.position.set(0, 0.13, -0.155);
    backBib.rotation.x = 0.04;
    this.chestGroup.add(backBib);

    // Overalls Shoulder Straps & Gleaming Brass Buttons
    [-1, 1].forEach(side => {
      const strapFront = enableShadows(new THREE.Mesh(
        new THREE.BoxGeometry(0.058, 0.19, 0.032),
        mats.denim
      ));
      strapFront.position.set(side * 0.095, 0.34, 0.142);
      strapFront.rotation.x = -0.22;
      this.chestGroup.add(strapFront);

      const strapTop = enableShadows(new THREE.Mesh(
        new THREE.BoxGeometry(0.06, 0.035, 0.24),
        mats.denim
      ));
      strapTop.position.set(side * 0.105, 0.435, 0.0);
      this.chestGroup.add(strapTop);

      const strapBack = enableShadows(new THREE.Mesh(
        new THREE.BoxGeometry(0.058, 0.20, 0.032),
        mats.denim
      ));
      strapBack.position.set(side * 0.085, 0.33, -0.138);
      strapBack.rotation.x = 0.22;
      strapBack.rotation.z = side * 0.12;
      this.chestGroup.add(strapBack);

      // Brass suspender buckle button on front bib
      const button = enableShadows(new THREE.Mesh(
        new THREE.CylinderGeometry(0.022, 0.022, 0.018, 10),
        mats.brass
      ));
      button.rotation.x = Math.PI / 2;
      button.position.set(side * 0.095, 0.255, 0.182);
      this.chestGroup.add(button);
    });

    // =========================================================================
    // 3. ARTICULATED ARMS, ROLLED SLEEVES & HANDS (Shoulders at Y = 0.37m in chestGroup)
    // =========================================================================
    const createArmAssembly = (side) => {
      const armPivot = new THREE.Group();
      armPivot.position.set(side * 0.265, 0.36, 0);
      armPivot.rotation.z = side * -0.08;

      // Orange shirt shoulder cap
      const shoulderCap = enableShadows(new THREE.Mesh(
        new THREE.SphereGeometry(0.082, 10, 8),
        mats.shirtOrange
      ));
      armPivot.add(shoulderCap);

      // Upper arm orange shirt sleeve
      const upperSleeve = enableShadows(new THREE.Mesh(
        new THREE.CylinderGeometry(0.076, 0.068, 0.22, 10),
        mats.shirtOrange
      ));
      upperSleeve.position.set(0, -0.11, 0);
      armPivot.add(upperSleeve);

      // Rolled orange sleeve cuff above elbow
      const sleeveCuff = enableShadows(new THREE.Mesh(
        new THREE.TorusGeometry(0.068, 0.018, 8, 12),
        mats.shirtCuff
      ));
      sleeveCuff.rotation.x = Math.PI / 2;
      sleeveCuff.position.set(0, -0.21, 0);
      armPivot.add(sleeveCuff);

      // Elbow pivot at Y = -0.23m relative to shoulder
      const forearmPivot = new THREE.Group();
      forearmPivot.position.set(0, -0.23, 0);
      forearmPivot.rotation.x = -0.18; // Natural slight elbow bend
      armPivot.add(forearmPivot);

      const elbowJoint = enableShadows(new THREE.Mesh(
        new THREE.SphereGeometry(0.062, 8, 8),
        mats.skin
      ));
      forearmPivot.add(elbowJoint);

      // Bare sun-tanned forearm
      const forearm = enableShadows(new THREE.Mesh(
        new THREE.CylinderGeometry(0.060, 0.048, 0.22, 10),
        mats.skin
      ));
      forearm.position.set(0, -0.11, 0);
      forearmPivot.add(forearm);

      // Sculpted hand & thumb
      const palm = enableShadows(new THREE.Mesh(
        new THREE.SphereGeometry(0.056, 10, 8),
        mats.skin
      ));
      palm.scale.set(0.85, 1.15, 0.68);
      palm.position.set(0, -0.24, 0.008);
      forearmPivot.add(palm);

      const thumb = enableShadows(new THREE.Mesh(
        new THREE.CylinderGeometry(0.018, 0.016, 0.055, 6),
        mats.skin
      ));
      thumb.position.set(side * -0.042, -0.225, 0.032);
      thumb.rotation.x = 0.45;
      thumb.rotation.z = side * 0.4;
      forearmPivot.add(thumb);

      return { armPivot, forearmPivot };
    };

    const leftArm = createArmAssembly(-1);
    const rightArm = createArmAssembly(1);
    this.leftArmPivot = leftArm.armPivot;
    this.leftForearmPivot = leftArm.forearmPivot;
    this.rightArmPivot = rightArm.armPivot;
    this.rightForearmPivot = rightArm.forearmPivot;
    this.chestGroup.add(this.leftArmPivot);
    this.chestGroup.add(this.rightArmPivot);

    // =========================================================================
    // 4. HEAD, EXPRESSIVE FACIAL FEATURES & WOVEN STRAW HAT
    // =========================================================================
    this.headPivot = new THREE.Group();
    this.headPivot.position.set(0, 0.44, 0);
    this.chestGroup.add(this.headPivot);

    // Neck
    const neck = enableShadows(new THREE.Mesh(
      new THREE.CylinderGeometry(0.072, 0.082, 0.11, 10),
      mats.skin
    ));
    neck.position.set(0, 0.04, 0);
    this.headPivot.add(neck);

    // Sculpted head sphere
    const head = enableShadows(new THREE.Mesh(
      new THREE.SphereGeometry(0.178, 16, 14),
      mats.skin
    ));
    head.scale.set(0.96, 1.06, 0.96);
    head.position.set(0, 0.21, 0);
    this.headPivot.add(head);

    // Ears
    [-1, 1].forEach(side => {
      const ear = enableShadows(new THREE.Mesh(
        new THREE.SphereGeometry(0.038, 8, 8),
        mats.skin
      ));
      ear.scale.set(0.45, 0.85, 0.65);
      ear.position.set(side * 0.172, 0.205, -0.01);
      this.headPivot.add(ear);

      // Warm rosy cheek blushes
      const cheek = new THREE.Mesh(
        new THREE.SphereGeometry(0.034, 8, 6),
        mats.skinBlush
      );
      cheek.scale.set(1.1, 0.65, 0.4);
      cheek.position.set(side * 0.105, 0.172, 0.145);
      this.headPivot.add(cheek);
    });

    // Chestnut-brown hair back & sideburns + forehead fringe tufts under hat
    const hairBack = enableShadows(new THREE.Mesh(
      new THREE.SphereGeometry(0.182, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.62),
      mats.hair
    ));
    hairBack.scale.set(0.97, 1.04, 0.98);
    hairBack.rotation.x = -0.38;
    hairBack.position.set(0, 0.22, -0.012);
    this.headPivot.add(hairBack);

    [-1, 1].forEach(side => {
      const sideburn = enableShadows(new THREE.Mesh(
        new THREE.BoxGeometry(0.028, 0.085, 0.045),
        mats.hair
      ));
      sideburn.position.set(side * 0.158, 0.215, 0.045);
      this.headPivot.add(sideburn);
    });

    for (let t = -1; t <= 1; t++) {
      const fringe = enableShadows(new THREE.Mesh(
        new THREE.ConeGeometry(0.032, 0.075, 5),
        mats.hair
      ));
      fringe.position.set(t * 0.052, 0.305, 0.158);
      fringe.rotation.x = Math.PI * 0.88;
      fringe.rotation.z = t * 0.22;
      this.headPivot.add(fringe);
    }

    // Expressive Eyes with Sclera, Warm Brown Iris, Pupil & Catchlight
    this.eyeGroups = [];
    [-1, 1].forEach(side => {
      const eyeGroup = new THREE.Group();
      eyeGroup.position.set(side * 0.064, 0.218, 0.156);

      const sclera = new THREE.Mesh(
        new THREE.SphereGeometry(0.026, 10, 8),
        mats.eyeWhite
      );
      sclera.scale.set(1.0, 1.12, 0.55);
      eyeGroup.add(sclera);

      const iris = new THREE.Mesh(
        new THREE.SphereGeometry(0.017, 8, 8),
        mats.eyeIris
      );
      iris.scale.set(1.0, 1.08, 0.45);
      iris.position.set(0, 0, 0.010);
      eyeGroup.add(iris);

      const pupil = new THREE.Mesh(
        new THREE.SphereGeometry(0.010, 8, 6),
        mats.eyePupil
      );
      pupil.scale.set(1.0, 1.0, 0.4);
      pupil.position.set(0, 0, 0.015);
      eyeGroup.add(pupil);

      const catchlight = new THREE.Mesh(
        new THREE.SphereGeometry(0.0045, 6, 6),
        mats.eyeWhite
      );
      catchlight.position.set(side * 0.005, 0.006, 0.018);
      eyeGroup.add(catchlight);

      this.headPivot.add(eyeGroup);
      this.eyeGroups.push(eyeGroup);

      // Expressive eyebrow
      const brow = new THREE.Mesh(
        new THREE.BoxGeometry(0.052, 0.014, 0.018),
        mats.hair
      );
      brow.position.set(side * 0.065, 0.262, 0.158);
      brow.rotation.z = side * -0.10;
      brow.rotation.y = side * 0.22;
      this.headPivot.add(brow);
    });

    // Sculpted Nose
    const nose = enableShadows(new THREE.Mesh(
      new THREE.ConeGeometry(0.024, 0.056, 8),
      mats.skinBlush
    ));
    nose.rotation.x = Math.PI / 2 - 0.18;
    nose.position.set(0, 0.192, 0.182);
    this.headPivot.add(nose);

    // Friendly Warm Smile
    const smile = new THREE.Mesh(
      new THREE.TorusGeometry(0.042, 0.0085, 6, 12, Math.PI * 0.85),
      mats.hair
    );
    smile.rotation.z = Math.PI + 0.22;
    smile.rotation.x = -0.12;
    smile.position.set(0, 0.152, 0.158);
    this.headPivot.add(smile);

    // Woven Golden Straw Hat
    const hatGroup = new THREE.Group();
    hatGroup.position.set(0, 0.325, -0.008);
    hatGroup.rotation.x = -0.06; // Jaunty tilt revealing Caleb's face
    this.headPivot.add(hatGroup);

    // Wide sun-shading brim
    const hatBrim = enableShadows(new THREE.Mesh(
      new THREE.CylinderGeometry(0.36, 0.38, 0.024, 20),
      mats.strawHat
    ));
    hatGroup.add(hatBrim);

    // Woven rim ring around outer brim
    const brimRim = enableShadows(new THREE.Mesh(
      new THREE.TorusGeometry(0.37, 0.016, 8, 20),
      mats.strawRim
    ));
    brimRim.rotation.x = Math.PI / 2;
    hatGroup.add(brimRim);

    // Straw hat crown
    const hatCrown = enableShadows(new THREE.Mesh(
      new THREE.CylinderGeometry(0.165, 0.198, 0.15, 16),
      mats.strawHat
    ));
    hatCrown.position.set(0, 0.082, 0);
    hatGroup.add(hatCrown);

    // Rounded crown top
    const hatTop = enableShadows(new THREE.Mesh(
      new THREE.CylinderGeometry(0.145, 0.165, 0.025, 16),
      mats.strawRim
    ));
    hatTop.position.set(0, 0.162, 0);
    hatGroup.add(hatTop);

    // Rustic dark leather hatband with brass buckle
    const hatBand = enableShadows(new THREE.Mesh(
      new THREE.CylinderGeometry(0.201, 0.203, 0.036, 16),
      mats.hatBand
    ));
    hatBand.position.set(0, 0.026, 0);
    hatGroup.add(hatBand);

    const hatBuckle = enableShadows(new THREE.Mesh(
      new THREE.BoxGeometry(0.042, 0.038, 0.016),
      mats.brass
    ));
    hatBuckle.position.set(0, 0.026, 0.202);
    hatGroup.add(hatBuckle);

    // Golden wheat stem tucked into hatband
    const wheatStem = enableShadows(new THREE.Mesh(
      new THREE.CylinderGeometry(0.006, 0.008, 0.18, 6),
      mats.brass
    ));
    wheatStem.position.set(-0.195, 0.08, 0.04);
    wheatStem.rotation.z = 0.45;
    wheatStem.rotation.x = -0.25;
    hatGroup.add(wheatStem);

    // =========================================================================
    // 5. INVISIBLE INTERACTION RAYCAST HITBOX PROXY
    // =========================================================================
    const hitboxGeo = new THREE.BoxGeometry(0.78, 1.85, 0.78);
    const hitboxMat = new THREE.MeshBasicMaterial({
      visible: false
    });
    this.hitboxMesh = new THREE.Mesh(hitboxGeo, hitboxMat);
    this.hitboxMesh.position.set(0, 0.925, 0);
    this.group.add(this.hitboxMesh);
  }

  /**
   * Default safe patrol loop around the farmhouse, main lanes, and into/out of
   * the NW Carrot Patch and NE Pumpkin Patch strictly via their South Gate openings.
   */
  createDefaultPatrolRoute() {
    return [
      { x: 1.6,    z: -19.5, pause: 2.2, label: 'Farmhouse Steps Plaza' },
      { x: 0.0,    z: -21.5, pause: 0.0, label: 'Terrace Steps Foot' },
      { x: 0.0,    z: -23.4, pause: 0.0, label: 'Terrace Steps Top' },
      { x: 1.8,    z: -25.0, pause: 2.5, label: 'Homestead Porch Terrace' },
      { x: 0.0,    z: -23.4, pause: 0.0, label: 'Terrace Steps Top Exit' },
      { x: 0.0,    z: -21.2, pause: 0.0, label: 'Terrace Steps Foot Exit' },
      { x: 0.0,    z: -11.5, pause: 0.8, label: 'North Main Avenue' },
      { x: -11.5,  z: -6.0,  pause: 0.0, label: 'West Cross-Lane' },
      { x: -17.85, z: -6.0,  pause: 0.0, label: 'West of Stone Well Approach' },
      { x: -17.85, z: -8.2,  pause: 0.0, label: 'NW Carrot Paddock Gate Approach' },
      { x: -17.65, z: -10.2, pause: 0.0, label: 'NW Carrot Paddock South Gate Inside' },
      { x: -16.0,  z: -13.0, pause: 2.6, label: 'NW Carrot Patch Inspection' },
      { x: -17.65, z: -10.2, pause: 0.0, label: 'NW Carrot Paddock South Gate Exit' },
      { x: -17.85, z: -8.2,  pause: 0.0, label: 'West of Stone Well Exit' },
      { x: -17.85, z: -6.0,  pause: 0.0, label: 'West Cross-Lane Return' },
      { x: 0.0,    z: -6.6,  pause: 0.8, label: 'Main Crossroads' },
      { x: 12.0,   z: -6.6,  pause: 0.0, label: 'East Cross-Lane' },
      { x: 15.0,   z: -6.6,  pause: 0.0, label: 'NE Pumpkin Paddock Gate Approach' },
      { x: 15.0,   z: -9.8,  pause: 0.0, label: 'NE Pumpkin Paddock South Gate Inside' },
      { x: 15.5,   z: -13.0, pause: 2.6, label: 'NE Pumpkin Patch Inspection' },
      { x: 15.0,   z: -9.8,  pause: 0.0, label: 'NE Pumpkin Paddock South Gate Exit' },
      { x: 15.0,   z: -6.6,  pause: 0.0, label: 'East Cross-Lane Return' },
      { x: 0.0,    z: -6.6,  pause: 0.0, label: 'Main Crossroads Southbound' },
      { x: -1.4,   z: 3.5,   pause: 2.2, label: 'Homestead Garden Overlook' },
      { x: 0.0,    z: 11.5,  pause: 1.8, label: 'South Main Avenue' },
      { x: 1.2,    z: -5.0,  pause: 0.0, label: 'Main Avenue Northbound' }
    ];
  }

  /**
   * Computes exact ground elevation under (x, z), including smooth step interpolation
   * on the Homestead Terrace front staircase (x in [-2.3, 2.3], z in [-23.0, -21.8]).
   */
  getTerrainHeight(x, z) {
    // Smooth ramp across the front stone steps of the Homestead Terrace
    if (Math.abs(x) <= 2.35 && z >= -23.0 && z <= -21.8) {
      const t = (-21.8 - z) / (-21.8 - (-23.0)); // 0 at bottom (-21.8), 1 at top (-23.0)
      return Math.max(0, Math.min(0.60, t * 0.60));
    }
    if (this.world && typeof this.world.getGroundElevation === 'function') {
      return this.world.getGroundElevation(x, z);
    }
    if (Math.abs(x) <= 14.3 && z >= -45.3 && z <= -22.7) {
      return 0.60;
    }
    return 0.0;
  }

  /**
   * Returns the paddock descriptor if point (x, z) lies inside one of the 4 fenced paddocks.
   */
  getContainingPaddock(x, z) {
    const paddocks = (this.world && this.world.paddocks && this.world.paddocks.length > 0)
      ? this.world.paddocks
      : [
          { x: -16, z: -14, w: 14, d: 10, gate: { x: -16, z: -9, halfWidth: 2.35 } },
          { x: 16,  z: -14, w: 14, d: 10, gate: { x: 16,  z: -9, halfWidth: 2.35 } },
          { x: -16, z: 16,  w: 14, d: 10, gate: { x: -16, z: 21, halfWidth: 2.35 } },
          { x: 16,  z: 16,  w: 14, d: 10, gate: { x: 16,  z: 21, halfWidth: 2.35 } }
        ];

    for (const p of paddocks) {
      const hw = p.w / 2;
      const hd = p.d / 2;
      if (x > p.x - hw && x < p.x + hw && z > p.z - hd && z < p.z + hd) {
        return p;
      }
    }
    return null;
  }

  /**
   * Returns the safe gate X coordinate for a paddock:
   * - Shifts to -17.7m on NW paddock to clear the Stone Well at (-16, -8)
   * - Shifts to +15.0m on NE paddock to clear the Apple Crate at (16.5, -9)
   */
  getSafeGateX(paddock) {
    if (paddock.x < 0 && paddock.z < 0) {
      return paddock.x - 1.7; // -17.7m for NW paddock (west of Stone Well)
    }
    if (paddock.x > 0 && paddock.z < 0) {
      return paddock.x - 1.0; // 15.0m for NE paddock (west of Apple Crate)
    }
    return paddock.gate ? paddock.gate.x : paddock.x;
  }

  /**
   * Expands a navigation segment from (fromX, fromZ) to target waypoint so that:
   * - Entering or exiting any fenced paddock ALWAYS routes through its South Gate opening.
   * - Ascending or descending the Homestead Terrace ALWAYS routes through the front steps.
   */
  buildSafePath(fromX, fromZ, targetWp) {
    const queue = [];
    let curX = fromX;
    let curZ = fromZ;

    // 1. Check if currently inside a paddock and target is outside that paddock
    const startPaddock = this.getContainingPaddock(curX, curZ);
    const endPaddock = this.getContainingPaddock(targetWp.x, targetWp.z);

    if (startPaddock && startPaddock !== endPaddock) {
      const gx = this.getSafeGateX(startPaddock);
      const gz = startPaddock.z + startPaddock.d / 2;
      if (Math.hypot(curX - gx, curZ - gz) > 1.2) {
        queue.push({ x: gx, z: gz - 0.9, pause: 0 });
        queue.push({ x: gx, z: gz + 1.1, pause: 0 });
        curX = gx;
        curZ = gz + 1.1;
      }
    }

    // 2. Check Terrace Knoll transition (must use front steps at x = 0, z in [-23.4, -21.4])
    const startOnTerrace = Math.abs(curX) <= 14.5 && curZ <= -22.6;
    const endOnTerrace = Math.abs(targetWp.x) <= 14.5 && targetWp.z <= -22.6;
    if (startOnTerrace !== endOnTerrace) {
      if (startOnTerrace) {
        if (Math.hypot(curX - 0, curZ - (-23.4)) > 0.6) {
          queue.push({ x: 0.0, z: -23.4, pause: 0 });
        }
        queue.push({ x: 0.0, z: -21.2, pause: 0 });
        curX = 0.0;
        curZ = -21.2;
      } else {
        if (Math.hypot(curX - 0, curZ - (-21.2)) > 0.6) {
          queue.push({ x: 0.0, z: -21.2, pause: 0 });
        }
        queue.push({ x: 0.0, z: -23.4, pause: 0 });
        curX = 0.0;
        curZ = -23.4;
      }
    }

    // 3. Check if target is inside a paddock and we are outside it
    if (endPaddock && startPaddock !== endPaddock) {
      const gx = this.getSafeGateX(endPaddock);
      const gz = endPaddock.z + endPaddock.d / 2;
      if (Math.hypot(curX - gx, curZ - gz) > 1.3 && Math.hypot(targetWp.x - gx, targetWp.z - gz) > 1.3) {
        queue.push({ x: gx, z: gz + 1.1, pause: 0 });
        queue.push({ x: gx, z: gz - 0.9, pause: 0 });
      }
    }

    queue.push({
      x: targetWp.x,
      z: targetWp.z,
      pause: targetWp.pause || 0,
      label: targetWp.label || ''
    });

    return queue;
  }

  queuePathToCurrentPatrolStop() {
    const wp = this.patrolWaypoints[this.currentWaypointIndex];
    if (!wp) return;
    this.activePathQueue = this.buildSafePath(this.position.x, this.position.z, wp);
  }

  /**
   * Returns static circular obstacles for props, well, and trees so Caleb smoothly steers around them
   */
  getCircularObstacles() {
    const list = [];

    // 1. All registered physics cylinders (trees & stone well)
    if (this.collisionWorld && this.collisionWorld.cylinders) {
      for (const cyl of this.collisionWorld.cylinders) {
        list.push({ x: cyl.x, z: cyl.z, radius: cyl.radius });
      }
    }

    // 2. Environmental props without cylinder colliders
    list.push(
      { x: -8.5, z: -9.0,  radius: 1.05 }, // Wheelbarrow
      { x: 8.5,  z: -9.0,  radius: 1.45 }, // Two-wheeled Farm Cart
      { x: -8.5, z: -17.0, radius: 0.72 }, // Carrot Crate
      { x: 8.5,  z: -17.0, radius: 0.72 }, // Pumpkin Crate
      { x: 16.5, z: -9.0,  radius: 0.58 }, // Apple Crate 1
      { x: 17.5, z: -8.5,  radius: 0.58 }, // Apple Crate 2
      { x: -16.0, z: 16.0, radius: 0.75 }, // Scarecrow in SW paddock
      { x: 26.0, z: -1.0,  radius: 1.65 }, // Orchard Picnic Table
      { x: 3.4,  z: -2.0,  radius: 1.25 }, // Homestead Welcome Signpost
      { x: -6.5, z: -25.0, radius: 0.85 }, // Seed Supply Bin on terrace
      // Paddock plot signposts just outside each south gate (+1.8m East, +0.4m South)
      { x: -16 + 1.8, z: -14 + 5.4, radius: 0.45 },
      { x: 16 + 1.8,  z: -14 + 5.4, radius: 0.45 },
      { x: -16 + 1.8, z: 16 + 5.4,  radius: 0.45 },
      { x: 16 + 1.8,  z: 16 + 5.4,  radius: 0.45 }
    );

    return list;
  }

  /**
   * Resolves hard geometric collisions against fence walls, retaining walls, AABBs,
   * circular props/trees/well, and the player so Caleb never walks through obstacles.
   */
  resolveObstacleCollisions(prevX, prevZ, player) {
    const r = this.radius;

    // 1. Paddock split-rail fence walls (with South Gate openings)
    const paddocks = (this.world && this.world.paddocks && this.world.paddocks.length > 0)
      ? this.world.paddocks
      : [
          { x: -16, z: -14, w: 14, d: 10, gate: { x: -16, z: -9, halfWidth: 2.35 } },
          { x: 16,  z: -14, w: 14, d: 10, gate: { x: 16,  z: -9, halfWidth: 2.35 } },
          { x: -16, z: 16,  w: 14, d: 10, gate: { x: -16, z: 21, halfWidth: 2.35 } },
          { x: 16,  z: 16,  w: 14, d: 10, gate: { x: 16,  z: 21, halfWidth: 2.35 } }
        ];

    const wallHalfThick = 0.16 + r;
    for (const p of paddocks) {
      const minX = p.x - p.w / 2;
      const maxX = p.x + p.w / 2;
      const minZ = p.z - p.d / 2;
      const maxZ = p.z + p.d / 2;
      const gateHalf = (p.gate && p.gate.halfWidth) ? p.gate.halfWidth : 2.35;
      const inGateX = Math.abs(this.position.x - p.x) <= (gateHalf - r * 0.35);

      // North fence wall (z = minZ)
      if (this.position.x >= minX - r && this.position.x <= maxX + r) {
        if (Math.abs(this.position.z - minZ) < wallHalfThick) {
          this.position.z = prevZ < minZ ? minZ - wallHalfThick : minZ + wallHalfThick;
        }
      }

      // South fence wall (z = maxZ), leaving central gate open
      if (this.position.x >= minX - r && this.position.x <= maxX + r && !inGateX) {
        if (Math.abs(this.position.z - maxZ) < wallHalfThick) {
          this.position.z = prevZ < maxZ ? maxZ - wallHalfThick : maxZ + wallHalfThick;
        }
      }

      // West fence wall (x = minX)
      if (this.position.z >= minZ - r && this.position.z <= maxZ + r) {
        if (Math.abs(this.position.x - minX) < wallHalfThick) {
          this.position.x = prevX < minX ? minX - wallHalfThick : minX + wallHalfThick;
        }
      }

      // East fence wall (x = maxX)
      if (this.position.z >= minZ - r && this.position.z <= maxZ + r) {
        if (Math.abs(this.position.x - maxX) < wallHalfThick) {
          this.position.x = prevX < maxX ? maxX - wallHalfThick : maxX + wallHalfThick;
        }
      }
    }

    // 2. Homestead Terrace Retaining Wall (z = -22.7, x in [-14.3, 14.3]), open at front steps |x| <= 2.1
    const inTerraceSteps = Math.abs(this.position.x) <= 2.1;
    if (Math.abs(this.position.x) <= 14.5 && !inTerraceSteps) {
      const frontWallZ = -22.7;
      if (Math.abs(this.position.z - frontWallZ) < wallHalfThick) {
        this.position.z = prevZ < frontWallZ ? frontWallZ - wallHalfThick : frontWallZ + wallHalfThick;
      }
    }

    // 3. Solid AABB colliders (Farmhouse walls, porch pillars, furniture)
    if (this.collisionWorld && this.collisionWorld.colliders) {
      const footY = this.position.y + 0.12;
      const headY = this.position.y + this.height;
      for (const col of this.collisionWorld.colliders) {
        if (!col.box || col.isCylinder || col.type === 'ground') continue;
        // Skip terrace slab itself when walking on or stepping onto terrace
        const bw = col.box.max.x - col.box.min.x;
        const bd = col.box.max.z - col.box.min.z;
        if (col.box.max.y <= 0.65 && bw > 20 && bd > 20) continue;
        if (col.box.max.y <= footY + 0.32 || col.box.min.y >= headY) continue;

        const minX = col.box.min.x - r;
        const maxX = col.box.max.x + r;
        const minZ = col.box.min.z - r;
        const maxZ = col.box.max.z + r;

        if (this.position.x > minX && this.position.x < maxX &&
            this.position.z > minZ && this.position.z < maxZ) {
          const penLeft = this.position.x - minX;
          const penRight = maxX - this.position.x;
          const penFront = this.position.z - minZ;
          const penBack = maxZ - this.position.z;
          const minPen = Math.min(penLeft, penRight, penFront, penBack);
          if (minPen === penLeft) this.position.x = minX;
          else if (minPen === penRight) this.position.x = maxX;
          else if (minPen === penFront) this.position.z = minZ;
          else this.position.z = maxZ;
        }
      }
    }

    // 4. Circular obstacles (trees, stone well, carts, crates, signposts)
    const circles = this.getCircularObstacles();
    for (const c of circles) {
      const dx = this.position.x - c.x;
      const dz = this.position.z - c.z;
      const distSq = dx * dx + dz * dz;
      const minDist = r + c.radius;
      if (distSq < minDist * minDist && distSq > 0.00001) {
        const dist = Math.sqrt(distSq);
        const pen = minDist - dist;
        this.position.x += (dx / dist) * pen;
        this.position.z += (dz / dist) * pen;
      }
    }

    // 5. Keep clear of player position
    if (player && player.position) {
      const dx = this.position.x - player.position.x;
      const dz = this.position.z - player.position.z;
      const distSq = dx * dx + dz * dz;
      const minDist = r + (player.radius || 0.45) + 0.05;
      if (distSq < minDist * minDist && distSq > 0.00001) {
        const dist = Math.sqrt(distSq);
        const pen = minDist - dist;
        this.position.x += (dx / dist) * pen;
        this.position.z += (dz / dist) * pen;
      }
    }
  }

  /**
   * Prevents the player from walking through Caleb when Caleb is stationary or moving.
   */
  resolvePlayerCollision(player) {
    if (!player || !player.position) return;
    if (Math.abs(player.position.y - this.position.y) > 1.65) return;

    const dx = player.position.x - this.position.x;
    const dz = player.position.z - this.position.z;
    const distSq = dx * dx + dz * dz;
    const minDist = (player.radius || 0.45) + this.radius;

    if (distSq < minDist * minDist) {
      const dist = Math.sqrt(distSq) || 0.001;
      const nx = dx / dist;
      const nz = dz / dist;
      const penetration = minDist - dist;

      player.position.x += nx * penetration;
      player.position.z += nz * penetration;

      // Slide player horizontal velocity along tangent
      if (player.velocity) {
        const normalVel = player.velocity.x * nx + player.velocity.z * nz;
        if (normalVel < 0) {
          player.velocity.x -= normalVel * nx;
          player.velocity.z -= normalVel * nz;
        }
      }

      // Sync first-person camera X/Z so there is zero visual jitter
      if (player.camera) {
        player.camera.position.x = player.position.x + (player.bobOffset ? player.bobOffset.x : 0);
        player.camera.position.z = player.position.z + (player.bobOffset ? player.bobOffset.z : 0);
      }
    }
  }

  /**
   * Triggered when the player looks at Caleb and presses E
   */
  onInteract(player) {
    if (sounds && sounds.playInteract) {
      sounds.playInteract();
    }

    // Face the player and wave warmly
    if (player && player.position) {
      const dx = player.position.x - this.position.x;
      const dz = player.position.z - this.position.z;
      this.targetYaw = Math.atan2(dx, dz);
    }
    this.talkPauseTimer = 4.0;
    this.waveTimer = 1.8;
    this.state = 'talking';

    const line = this.dialogueLines[this.dialogueIndex % this.dialogueLines.length];
    this.dialogueIndex++;

    const evt = new CustomEvent('game:message', {
      detail: { message: line }
    });
    window.dispatchEvent(evt);
  }

  /**
   * Main per-frame update for navigation, obstacle avoidance, grounding, and skeletal animation
   */
  update(dt, totalTime, player) {
    const prevX = this.position.x;
    const prevZ = this.position.z;

    // Check distance to player for polite yielding & head tracking
    let distToPlayer = Infinity;
    let angleToPlayer = this.yaw;
    if (player && player.position) {
      const dxP = player.position.x - this.position.x;
      const dzP = player.position.z - this.position.z;
      distToPlayer = Math.hypot(dxP, dzP);
      angleToPlayer = Math.atan2(dxP, dzP);
    }

    // 1. Handle talking pause or player standing directly in Caleb's personal space
    if (this.talkPauseTimer > 0) {
      this.talkPauseTimer -= dt;
    }

    const playerBlockingPath = distToPlayer < 1.35;
    let currentSpeed = 0;

    if (this.talkPauseTimer > 0 || playerBlockingPath) {
      this.state = this.talkPauseTimer > 0 ? 'talking' : 'idle';
      this.velocity.set(0, 0, 0);
      if (distToPlayer < 4.0) {
        this.targetYaw = angleToPlayer;
      }
      this.lastProgressPos.copy(this.position);
      this.stuckSampleTimer = 0;
    } else if (this.pauseTimer > 0) {
      // Pausing at a patrol inspection stop
      this.pauseTimer -= dt;
      this.state = 'idle';
      this.velocity.set(0, 0, 0);
      this.lastProgressPos.copy(this.position);
      this.stuckSampleTimer = 0;
    } else {
      // Active patrol navigation along activePathQueue
      if (this.activePathQueue.length === 0) {
        this.currentWaypointIndex = (this.currentWaypointIndex + 1) % this.patrolWaypoints.length;
        this.queuePathToCurrentPatrolStop();
      }

      const subTarget = this.activePathQueue[0];
      const toX = subTarget.x - this.position.x;
      const toZ = subTarget.z - this.position.z;
      const distToTarget = Math.hypot(toX, toZ);

      if (distToTarget <= 0.32) {
        // Reached sub-waypoint
        this.activePathQueue.shift();
        this.stuckCount = 0;
        if (this.activePathQueue.length === 0 && subTarget.pause > 0) {
          this.pauseTimer = subTarget.pause;
          this.state = 'idle';
          this.velocity.set(0, 0, 0);
        }
      } else {
        this.state = 'walking';
        let dirX = toX / distToTarget;
        let dirZ = toZ / distToTarget;

        // Smooth local obstacle avoidance steering
        const circles = this.getCircularObstacles();
        let steerX = 0;
        let steerZ = 0;

        for (const c of circles) {
          const ox = this.position.x - c.x;
          const oz = this.position.z - c.z;
          const d = Math.hypot(ox, oz);
          const avoidRange = this.radius + c.radius + 1.15;
          if (d < avoidRange && d > 0.001) {
            // Check if obstacle is ahead of us
            const dot = (ox / d) * (-dirX) + (oz / d) * (-dirZ);
            if (dot > -0.2) {
              const weight = Math.pow((avoidRange - d) / avoidRange, 1.5) * 1.65;
              steerX += (ox / d) * weight;
              steerZ += (oz / d) * weight;
            }
          }
        }

        // Also steer gently around player when player is nearby (1.35m..2.8m)
        if (distToPlayer < 2.8 && distToPlayer > 0.01) {
          const ox = this.position.x - player.position.x;
          const oz = this.position.z - player.position.z;
          const weight = ((2.8 - distToPlayer) / 2.8) * 1.4;
          steerX += (ox / distToPlayer) * weight;
          steerZ += (oz / distToPlayer) * weight;
        }

        dirX += steerX;
        dirZ += steerZ;
        const len = Math.hypot(dirX, dirZ) || 1;
        dirX /= len;
        dirZ /= len;

        // Smooth deceleration as approaching a stop waypoint
        const slowFactor = (this.activePathQueue.length === 1 && subTarget.pause > 0 && distToTarget < 1.1)
          ? Math.max(0.42, distToTarget / 1.1)
          : 1.0;

        const targetSpeed = this.walkSpeed * slowFactor;
        this.velocity.x = THREE.MathUtils.lerp(this.velocity.x, dirX * targetSpeed, Math.min(1, dt * 8));
        this.velocity.z = THREE.MathUtils.lerp(this.velocity.z, dirZ * targetSpeed, Math.min(1, dt * 8));

        this.position.x += this.velocity.x * dt;
        this.position.z += this.velocity.z * dt;

        // Resolve hard obstacle boundaries
        this.resolveObstacleCollisions(prevX, prevZ, player);

        const actualDx = this.position.x - prevX;
        const actualDz = this.position.z - prevZ;
        currentSpeed = dt > 0.0001 ? Math.hypot(actualDx, actualDz) / dt : 0;

        if (currentSpeed > 0.15) {
          this.targetYaw = Math.atan2(actualDx, actualDz);
        } else {
          this.targetYaw = Math.atan2(toX, toZ);
        }

        // Stuck detection & automatic recovery
        this.stuckSampleTimer += dt;
        if (this.stuckSampleTimer >= 1.0) {
          const movedDist = Math.hypot(
            this.position.x - this.lastProgressPos.x,
            this.position.z - this.lastProgressPos.z
          );
          this.lastProgressPos.copy(this.position);
          this.stuckSampleTimer = 0;

          if (movedDist < 0.22) {
            this.stuckCount++;
            this.sidestepDir *= -1;
            const perpX = -toZ / distToTarget;
            const perpZ = toX / distToTarget;
            if (this.stuckCount <= 2) {
              // Inject lateral sidestep to clear corner or obstacle
              this.activePathQueue.unshift({
                x: this.position.x + perpX * 1.45 * this.sidestepDir,
                z: this.position.z + perpZ * 1.45 * this.sidestepDir,
                pause: 0
              });
            } else {
              // Skip blocked sub-waypoint and re-route to next patrol stop
              this.stuckCount = 0;
              this.currentWaypointIndex = (this.currentWaypointIndex + 1) % this.patrolWaypoints.length;
              this.queuePathToCurrentPatrolStop();
            }
          } else {
            this.stuckCount = 0;
          }
        }
      }
    }

    // 2. Align feet to exact terrain elevation
    const targetGroundY = this.getTerrainHeight(this.position.x, this.position.z);
    this.position.y = THREE.MathUtils.lerp(this.position.y, targetGroundY, Math.min(1, dt * 18));

    // 3. Smooth character yaw turning
    this.yaw = lerpAngle(this.yaw, this.targetYaw, dt * this.turnSpeed);

    // Sync world transform
    this.group.position.copy(this.position);
    this.group.rotation.y = this.yaw;

    // 4. Update procedural skeletal animations (idle, breathing, walking, head look, wave)
    this.updateAnimations(dt, totalTime, currentSpeed, distToPlayer, angleToPlayer);
  }

  /**
   * Updates articulated limbs, breathing, stride bounce, head look, blinking, and greeting wave
   */
  updateAnimations(dt, totalTime, currentSpeed, distToPlayer, angleToPlayer) {
    const isMoving = this.state === 'walking' && currentSpeed > 0.12;
    const targetBlend = isMoving ? Math.min(1.0, currentSpeed / this.walkSpeed) : 0.0;
    this.moveBlend = THREE.MathUtils.lerp(this.moveBlend, targetBlend, Math.min(1, dt * 9.0));

    if (isMoving) {
      this.walkPhase += dt * currentSpeed * 3.65;
    } else {
      // Gently settle walk phase toward neutral stance
      this.walkPhase += dt * 1.2 * this.moveBlend;
    }

    const s = Math.sin(this.walkPhase);
    const c = Math.cos(this.walkPhase);
    const b = this.moveBlend;

    // --- A. LEGS & KNEES (Grounded foot contact with natural forward-swing knee lift) ---
    const hipSwing = 0.56 * b;
    this.leftLegPivot.rotation.x = s * hipSwing;
    this.rightLegPivot.rotation.x = -s * hipSwing;

    // Knee bends backward (positive X rotation in local space since +Z is forward) during leg lift
    const leftKneeLift = Math.max(0, c) * 0.52 * b;
    const rightKneeLift = Math.max(0, -c) * 0.52 * b;
    this.leftShinPivot.rotation.x = leftKneeLift;
    this.rightShinPivot.rotation.x = rightKneeLift;

    // --- B. VERTICAL STRIDE BOUNCE & IDLE BREATHING ---
    const breathWave = Math.sin(totalTime * 2.15);
    const strideBounce = Math.abs(s) * 0.032 * b;
    this.bodyRoot.position.y = strideBounce;

    // Torso subtle forward lean when walking + gentle hip counter-sway + breathing expansion
    this.torsoPivot.rotation.x = 0.045 * b + breathWave * 0.012 * (1 - b * 0.5);
    this.torsoPivot.rotation.z = c * 0.028 * b;
    this.torsoPivot.rotation.y = -s * 0.055 * b;

    const breathScale = 1.0 + breathWave * 0.016;
    this.chestGroup.scale.set(breathScale, 1.0 + breathWave * 0.012, breathScale);
    this.chestGroup.position.y = 0.14 + breathWave * 0.005;

    // --- C. ARMS & ELBOWS (Opposite swing + friendly greeting wave when interacted with) ---
    const armSwing = 0.44 * b;
    const idleArmSway = Math.sin(totalTime * 1.65) * 0.035 * (1 - b);

    this.leftArmPivot.rotation.x = -s * armSwing + idleArmSway;
    this.leftArmPivot.rotation.z = -0.08 - (breathWave + 1) * 0.015;
    this.leftForearmPivot.rotation.x = -0.18 - Math.max(0, -s) * 0.26 * b;

    if (this.waveTimer > 0) {
      this.waveTimer -= dt;
      const waveBlend = Math.min(1, this.waveTimer * 3.0);
      const waveOsc = Math.sin(totalTime * 11.0) * 0.32;
      this.rightArmPivot.rotation.x = THREE.MathUtils.lerp(this.rightArmPivot.rotation.x, -2.15, waveBlend);
      this.rightArmPivot.rotation.z = THREE.MathUtils.lerp(0.08, 0.45 + waveOsc, waveBlend);
      this.rightForearmPivot.rotation.x = THREE.MathUtils.lerp(-0.18, -0.55, waveBlend);
    } else {
      this.rightArmPivot.rotation.x = s * armSwing - idleArmSway;
      this.rightArmPivot.rotation.z = 0.08 + (breathWave + 1) * 0.015;
      this.rightForearmPivot.rotation.x = -0.18 - Math.max(0, s) * 0.26 * b;
    }

    // --- D. HEAD TRACKING, IDLE LOOK-AROUND & BLINKING ---
    if (distToPlayer < 4.6) {
      // Look toward player if within a friendly cone in front of Caleb
      const relYaw = angleDiff(this.yaw, angleToPlayer);
      if (Math.abs(relYaw) < 1.35) {
        this.desiredHeadYaw = THREE.MathUtils.clamp(relYaw * 0.75, -0.68, 0.68);
        this.desiredHeadPitch = -0.05;
      } else {
        this.desiredHeadYaw = 0;
        this.desiredHeadPitch = 0;
      }
    } else if (!isMoving) {
      this.idleLookTimer -= dt;
      if (this.idleLookTimer <= 0) {
        this.idleLookTimer = 2.0 + Math.random() * 2.2;
        this.desiredHeadYaw = (Math.random() - 0.5) * 0.75;
        this.desiredHeadPitch = (Math.random() - 0.45) * 0.16;
      }
    } else {
      this.desiredHeadYaw = Math.sin(totalTime * 0.8) * 0.08;
      this.desiredHeadPitch = 0.02;
    }

    this.headYaw = THREE.MathUtils.lerp(this.headYaw, this.desiredHeadYaw, Math.min(1, dt * 5.5));
    this.headPitch = THREE.MathUtils.lerp(this.headPitch, this.desiredHeadPitch, Math.min(1, dt * 5.5));
    this.headPivot.rotation.y = this.headYaw;
    this.headPivot.rotation.x = this.headPitch;

    // Periodic natural eye blink
    this.blinkTimer -= dt;
    if (this.blinkTimer <= 0) {
      if (!this.isBlinking) {
        this.isBlinking = true;
        this.blinkTimer = 0.11;
      } else {
        this.isBlinking = false;
        this.blinkTimer = 2.6 + Math.random() * 2.8;
      }
    }
    const eyeScaleY = this.isBlinking ? 0.12 : 1.12;
    for (const eg of this.eyeGroups) {
      eg.scale.y = eyeScaleY;
    }
  }
}

/**
 * Manages all FarmWorker NPCs in Meadow Valley, registers their look-raycast
 * interactables, and updates movement + player-NPC collision separation each frame.
 */
export class WorkerManager {
  constructor(scene, world, collisionWorld, particleManager) {
    this.scene = scene;
    this.world = world;
    this.collisionWorld = collisionWorld;
    this.particles = particleManager;
    this.workers = [];

    this.spawnInitialWorkers();
  }

  spawnInitialWorkers() {
    // Spawn Caleb near the farmhouse steps overlooking the Main Avenue
    const caleb = new FarmWorker(this.scene, this.world, this.collisionWorld, {
      id: 'worker_caleb',
      name: 'Caleb',
      role: 'Farm Worker',
      x: 1.6,
      z: -19.5,
      yaw: 0
    });

    this.workers.push(caleb);
    this.caleb = caleb;

    // Register Caleb in world.interactables so looking at him displays "E — Talk to Caleb"
    if (this.world && Array.isArray(this.world.interactables)) {
      this.world.interactables.push({
        id: 'worker_caleb',
        isNPC: true,
        worker: caleb,
        mesh: caleb.hitboxMesh,
        name: 'Caleb',
        prompt: 'Talk to Caleb',
        customPrompt: '— Talk to Caleb',
        ready: true,
        interact: (player) => caleb.onInteract(player)
      });
    }
  }

  getWorkerByName(name) {
    return this.workers.find(w => w.name.toLowerCase() === name.toLowerCase()) || null;
  }

  update(dt, totalTime, player) {
    for (const worker of this.workers) {
      worker.update(dt, totalTime, player);
      worker.resolvePlayerCollision(player);
    }
  }
}
