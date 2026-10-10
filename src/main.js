import * as THREE from 'three';
import { CollisionWorld } from './collision.js';
import { ParticleManager } from './particles.js';
import { Player } from './player.js';
import { World } from './world.js';
import { sounds } from './audio.js';
import { TimeManager } from './time.js';
import { DayNightCycle } from './daynight.js';
import { saveManager } from './save.js';
import { events } from './events.js';
import { FarmingManager, CROPS, TOOLS } from './farming.js';

// 1. Scene, Camera, Renderer Setup
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x60a5fa);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.05, 600);
scene.add(camera);

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
container.appendChild(renderer.domElement);

// 2. Systems Initialization
const collisionWorld = new CollisionWorld();
const particleManager = new ParticleManager(scene);
const player = new Player(camera, collisionWorld, particleManager, scene);
const world = new World(scene, collisionWorld, particleManager);
const timeManager = new TimeManager();
const dayNightCycle = new DayNightCycle(scene, timeManager, world, renderer);
const farmingManager = new FarmingManager(scene, collisionWorld, particleManager, timeManager);

// Connect farming manager to player & world interactables
player.farmingManager = farmingManager;
if (farmingManager.seedSupplyInteractable) {
  world.interactables.push(farmingManager.seedSupplyInteractable);
}

// Wire save state provider
saveManager.registerStateProvider(() => ({
  player,
  world,
  timeManager,
  farming: farmingManager,
  settings: {
    mouseSensitivity: player.mouseSensitivity,
    headBobEnabled: player.headBobEnabled,
    invertY: player.invertY
  }
}));

// Default spawn coordinates
player.respawn(new THREE.Vector3(0, 1.2, 0));

// Expose globals for inspection, testing, and debugging
window.player = player;
window.world = world;
window.renderer = renderer;
window.camera = camera;
window.timeManager = timeManager;
window.dayNightCycle = dayNightCycle;
window.farmingManager = farmingManager;
window.CROPS = CROPS;
window.TOOLS = TOOLS;
window.saveManager = saveManager;
window.events = events;

// 3. UI Element References
const startOverlay = document.getElementById('start-overlay');
const pauseOverlay = document.getElementById('pause-overlay');
const backpackModal = document.getElementById('backpack-modal');
const confirmModal = document.getElementById('confirm-modal');

const btnContinue = document.getElementById('btn-continue');
const btnNewGame = document.getElementById('btn-new-game');
const btnResume = document.getElementById('btn-resume');
const btnRespawn = document.getElementById('btn-respawn');
const btnSave = document.getElementById('btn-save');
const pauseSaveStatus = document.getElementById('pause-save-status');

const btnConfirmCancel = document.getElementById('btn-confirm-cancel');
const btnConfirmOverwrite = document.getElementById('btn-confirm-overwrite');
const btnCloseBackpack = document.getElementById('btn-close-backpack');
const hotbarBackpack = document.getElementById('hotbar-backpack');

const timeIcon = document.getElementById('time-icon');
const timeClock = document.getElementById('time-clock');
const timeDate = document.getElementById('time-date');

const reticle = document.getElementById('reticle');
const interactPrompt = document.getElementById('interact-prompt');
const interactText = document.getElementById('interact-text');

const staminaFill = document.getElementById('stamina-fill');
const staminaText = document.getElementById('stamina-text');
const badgeGround = document.getElementById('badge-ground');
const badgeMove = document.getElementById('badge-move');

const countApple = document.getElementById('count-apple');
const countCarrot = document.getElementById('count-carrot');
const countPumpkin = document.getElementById('count-pumpkin');
const countWheat = document.getElementById('count-wheat');
const countTomato = document.getElementById('count-tomato');

const modalAppleCount = document.getElementById('modal-apple-count');
const modalCarrotCount = document.getElementById('modal-carrot-count');
const modalPumpkinCount = document.getElementById('modal-pumpkin-count');
const modalWheatCount = document.getElementById('modal-wheat-count');
const modalTomatoCount = document.getElementById('modal-tomato-count');

const modalSeedCarrotCount = document.getElementById('modal-seed-carrot-count');
const modalSeedWheatCount = document.getElementById('modal-seed-wheat-count');
const modalSeedPumpkinCount = document.getElementById('modal-seed-pumpkin-count');
const modalSeedTomatoCount = document.getElementById('modal-seed-tomato-count');

// Farming Tool Hotbar Slots & Badges
const toolHoe = document.getElementById('tool-hoe');
const toolWater = document.getElementById('tool-water');
const toolSeeds = document.getElementById('tool-seeds');
const toolSickle = document.getElementById('tool-sickle');
const toolSlots = [toolHoe, toolWater, toolSeeds, toolSickle];
const waterBadge = document.getElementById('water-badge');
const seedSlotName = document.getElementById('seed-slot-name');
const seedBadge = document.getElementById('seed-badge');

// Tutorial Banner Elements
const tutorialPanel = document.getElementById('tutorial-panel');
const tutorialStepNum = document.getElementById('tutorial-step-num');
const tutorialText = document.getElementById('tutorial-text');
const btnSkipTutorial = document.getElementById('btn-skip-tutorial');

const sliderSens = document.getElementById('slider-sens');
const sensVal = document.getElementById('sens-val');
const sliderVol = document.getElementById('slider-vol');
const volVal = document.getElementById('vol-val');
const toggleBob = document.getElementById('toggle-bob');
const toggleInvert = document.getElementById('toggle-invert');
const toastContainer = document.getElementById('toast-container');

// 4. Toast Notification System
function showToast(msg) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = msg;
  toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 2400);
}

window.addEventListener('game:message', (e) => {
  showToast(e.detail.message);
});

events.on('save:success', (d) => {
  if (pauseSaveStatus) {
    pauseSaveStatus.textContent = `Saved (${d.reason})`;
  }
});

// 5. Time & Calendar HUD Integration
events.on('time:tick', (snapshot) => {
  if (timeIcon) timeIcon.textContent = snapshot.phaseIcon;
  if (timeClock) timeClock.textContent = snapshot.formattedTime;
  if (timeDate) timeDate.textContent = snapshot.formattedDate;
});

// 6. Tool Hotbar & Tutorial HUD Systems
function updateToolHotbarUI() {
  toolSlots.forEach((slot, idx) => {
    if (slot) {
      slot.classList.toggle('active', farmingManager.activeToolIndex === idx);
    }
  });

  if (waterBadge) {
    waterBadge.textContent = `${farmingManager.wateringCanCurrent}/${farmingManager.wateringCanMax}`;
    waterBadge.style.opacity = farmingManager.wateringCanCurrent === 0 ? '0.6' : '1';
  }

  const crop = CROPS[farmingManager.selectedCropId];
  if (crop) {
    if (seedSlotName) seedSlotName.textContent = crop.name;
    if (seedBadge) {
      const count = player.getItemCount(crop.seedId);
      seedBadge.textContent = count;
      seedBadge.style.opacity = count === 0 ? '0.6' : '1';
    }
  }
}

const TUTORIAL_STEPS = {
  1: "Equip your Field Hoe [Press 1]",
  2: "Till a grass tile into farmland with Left Mouse Button [LMB]",
  3: "Equip your Seed Pouch [Press 3] and choose seeds [Q / R]",
  4: "Plant seeds into tilled soil with Left Mouse Button [LMB]",
  5: "Equip your Watering Can [Press 2]",
  6: "Water the planted tile with Left Mouse Button [LMB] (Refill at Well [E] if empty)",
  7: "Wait for sunrise or advance day, then harvest ripe crops with [E]!"
};

function updateTutorialUI(tutorial) {
  if (!tutorialPanel) return;
  if (tutorial.completed) {
    tutorialStepNum.textContent = 'DONE';
    tutorialText.textContent = '🎉 Tutorial Complete! Happy farming!';
    setTimeout(() => {
      tutorialPanel.classList.add('hidden');
    }, 4000);
    return;
  }
  if (tutorial.skipped) {
    tutorialPanel.classList.add('hidden');
    return;
  }
  tutorialPanel.classList.remove('hidden');
  tutorialStepNum.textContent = `Step ${tutorial.step} of 7`;
  tutorialText.textContent = TUTORIAL_STEPS[tutorial.step] || '';
}

window.addEventListener('tutorial:update', (e) => {
  updateTutorialUI(e.detail);
});

if (btnSkipTutorial) {
  btnSkipTutorial.addEventListener('click', () => {
    farmingManager.skipTutorial();
    showToast('Farming tutorial skipped');
  });
}

window.addEventListener('tool:change', () => updateToolHotbarUI());
window.addEventListener('crop:change', () => updateToolHotbarUI());
events.on('farming:watered', () => updateToolHotbarUI());
events.on('farming:refilled', () => updateToolHotbarUI());
events.on('farming:planted', () => updateToolHotbarUI());

// Interactive clicking on tool slots in HUD
toolSlots.forEach((slot, idx) => {
  if (slot) {
    slot.addEventListener('click', () => {
      farmingManager.activeToolIndex = idx;
      updateToolHotbarUI();
      if (idx === 0 && farmingManager.tutorial.step === 1) farmingManager.advanceTutorial(2);
      if (idx === 2 && farmingManager.tutorial.step === 3) farmingManager.advanceTutorial(4);
      if (idx === 1 && farmingManager.tutorial.step === 5) farmingManager.advanceTutorial(6);
    });
  }
});

// Click seed slot to cycle seeds
if (toolSeeds) {
  toolSeeds.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    const cropOrder = ['carrot', 'wheat', 'pumpkin', 'tomato'];
    const currIdx = cropOrder.indexOf(farmingManager.selectedCropId);
    farmingManager.selectedCropId = cropOrder[(currIdx + 1) % cropOrder.length];
    updateToolHotbarUI();
  });
}

// 7. Backpack Inventory UI Updates
function updateBackpackUI(backpack) {
  backpack.forEach((item) => {
    if (item.id === 'apple') {
      if (countApple) countApple.textContent = item.count;
      if (modalAppleCount) modalAppleCount.textContent = `Count: ${item.count}`;
      document.getElementById('slot-apple')?.classList.toggle('has-item', item.count > 0);
    } else if (item.id === 'carrot') {
      if (countCarrot) countCarrot.textContent = item.count;
      if (modalCarrotCount) modalCarrotCount.textContent = `Count: ${item.count}`;
      document.getElementById('slot-carrot')?.classList.toggle('has-item', item.count > 0);
    } else if (item.id === 'wheat') {
      if (countWheat) countWheat.textContent = item.count;
      if (modalWheatCount) modalWheatCount.textContent = `Count: ${item.count}`;
      document.getElementById('slot-wheat')?.classList.toggle('has-item', item.count > 0);
    } else if (item.id === 'pumpkin') {
      if (countPumpkin) countPumpkin.textContent = item.count;
      if (modalPumpkinCount) modalPumpkinCount.textContent = `Count: ${item.count}`;
      document.getElementById('slot-pumpkin')?.classList.toggle('has-item', item.count > 0);
    } else if (item.id === 'tomato') {
      if (countTomato) countTomato.textContent = item.count;
      if (modalTomatoCount) modalTomatoCount.textContent = `Count: ${item.count}`;
      document.getElementById('slot-tomato')?.classList.toggle('has-item', item.count > 0);
    } else if (item.id === 'seed_carrot') {
      if (modalSeedCarrotCount) modalSeedCarrotCount.textContent = `Count: ${item.count}`;
    } else if (item.id === 'seed_wheat') {
      if (modalSeedWheatCount) modalSeedWheatCount.textContent = `Count: ${item.count}`;
    } else if (item.id === 'seed_pumpkin') {
      if (modalSeedPumpkinCount) modalSeedPumpkinCount.textContent = `Count: ${item.count}`;
    } else if (item.id === 'seed_tomato') {
      if (modalSeedTomatoCount) modalSeedTomatoCount.textContent = `Count: ${item.count}`;
    }
  });
  updateToolHotbarUI();
}

window.addEventListener('backpack:update', (e) => {
  updateBackpackUI(e.detail.backpack);
});

function toggleBackpackModal() {
  const isHidden = backpackModal.classList.contains('hidden');
  if (isHidden) {
    backpackModal.classList.remove('hidden');
    document.exitPointerLock();
  } else {
    backpackModal.classList.add('hidden');
    lockPointer();
  }
}

window.addEventListener('backpack:toggle', toggleBackpackModal);
hotbarBackpack.addEventListener('click', toggleBackpackModal);
btnCloseBackpack.addEventListener('click', toggleBackpackModal);

// 8. Save / Load & Menu Management
function applySaveData(saveData) {
  if (!saveData) return false;
  if (saveData.player) player.restoreState(saveData.player);
  if (saveData.world) world.restoreCropsAndFruits(saveData.world.crops, saveData.world.fruits);
  if (saveData.farming) farmingManager.restoreState(saveData.farming);
  if (saveData.time) timeManager.deserialize(saveData.time);
  if (saveData.settings) {
    if (typeof saveData.settings.mouseSensitivity === 'number') {
      player.mouseSensitivity = saveData.settings.mouseSensitivity;
      sliderSens.value = player.mouseSensitivity;
      sensVal.textContent = `${player.mouseSensitivity.toFixed(1)}x`;
    }
    if (typeof saveData.settings.headBobEnabled === 'boolean') {
      player.headBobEnabled = saveData.settings.headBobEnabled;
      toggleBob.checked = player.headBobEnabled;
    }
    if (typeof saveData.settings.invertY === 'boolean') {
      player.invertY = saveData.settings.invertY;
      toggleInvert.checked = player.invertY;
    }
  }

  updateBackpackUI(player.backpack);
  updateToolHotbarUI();
  updateTutorialUI(farmingManager.tutorial);
  return true;
}

// Check for existing save on initialization
function refreshMenuSaveButtons() {
  const hasSave = saveManager.hasSaveData();
  if (hasSave) {
    btnContinue.classList.remove('hidden');
  } else {
    btnContinue.classList.add('hidden');
  }
}
refreshMenuSaveButtons();

let isGameStarted = false;

function lockPointer() {
  sounds.resume();
  document.body.requestPointerLock();
}

function startNewGame() {
  player.respawn(new THREE.Vector3(0, 1.2, 0));
  timeManager.setTime(8, 0); // 08:00 AM Spring 1

  // Clean farming state
  farmingManager.tiles.forEach(tile => farmingManager.farmingGroup.remove(tile.soilGroup));
  farmingManager.tiles.clear();
  farmingManager.activeToolIndex = 0;
  farmingManager.selectedCropId = 'carrot';
  farmingManager.wateringCanCurrent = 12;
  farmingManager.tutorial = { step: 1, completed: false, skipped: false };

  isGameStarted = true;
  startOverlay.classList.add('hidden');
  lockPointer();

  updateBackpackUI(player.backpack);
  updateToolHotbarUI();
  updateTutorialUI(farmingManager.tutorial);

  saveManager.save('new_game_start');
  showToast('Welcome to your Meadow Valley Farm 🌾');
}

btnContinue.addEventListener('click', () => {
  const loaded = saveManager.load();
  if (loaded) {
    applySaveData(loaded);
    showToast('Loaded saved farm progress 🌾');
  }
  isGameStarted = true;
  startOverlay.classList.add('hidden');
  lockPointer();
});

btnNewGame.addEventListener('click', () => {
  if (saveManager.hasSaveData()) {
    confirmModal.classList.remove('hidden');
  } else {
    startNewGame();
  }
});

btnConfirmCancel.addEventListener('click', () => {
  confirmModal.classList.add('hidden');
});

btnConfirmOverwrite.addEventListener('click', () => {
  confirmModal.classList.add('hidden');
  saveManager.deleteSave();
  startNewGame();
  refreshMenuSaveButtons();
});

btnSave.addEventListener('click', () => {
  const success = saveManager.save('manual');
  if (success) {
    if (pauseSaveStatus) {
      pauseSaveStatus.textContent = `Saved at ${timeManager.getFormattedTime()}`;
    }
    showToast('💾 Farm progress saved successfully!');
    refreshMenuSaveButtons();
  }
});

btnResume.addEventListener('click', () => {
  lockPointer();
});

btnRespawn.addEventListener('click', () => {
  player.respawn(new THREE.Vector3(0, 1.2, 0));
  lockPointer();
  showToast('Position Reset to Farm Path');
});

// 8. Pointer Lock & Overlay Handlers
document.addEventListener('pointerlockchange', () => {
  if (document.pointerLockElement === document.body) {
    startOverlay.classList.add('hidden');
    pauseOverlay.classList.add('hidden');
    backpackModal.classList.add('hidden');
    confirmModal.classList.add('hidden');
    timeManager.resume();
  } else {
    if (isGameStarted && backpackModal.classList.contains('hidden') && confirmModal.classList.contains('hidden')) {
      pauseOverlay.classList.remove('hidden');
      timeManager.pause();
    }
  }
});

// Settings Events
sliderSens.addEventListener('input', (e) => {
  const val = parseFloat(e.target.value);
  player.mouseSensitivity = val;
  sensVal.textContent = `${val.toFixed(1)}x`;
});

sliderVol.addEventListener('input', (e) => {
  const val = parseFloat(e.target.value);
  sounds.setVolume(val);
  volVal.textContent = `${Math.round(val * 100)}%`;
});

toggleBob.addEventListener('change', (e) => {
  player.headBobEnabled = e.target.checked;
});

toggleInvert.addEventListener('change', (e) => {
  player.invertY = e.target.checked;
});

// Window Resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Prevent context menu
window.addEventListener('contextmenu', (e) => e.preventDefault());

// 9. URL Query Presets for Validation, QA & Screenshot Captures
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.has('started')) {
  isGameStarted = true;
  startOverlay.classList.add('hidden');
  startOverlay.style.display = 'none';
}
if (urlParams.has('continue')) {
  const loaded = saveManager.load();
  if (loaded) applySaveData(loaded);
  isGameStarted = true;
  startOverlay.classList.add('hidden');
  startOverlay.style.display = 'none';
}
if (urlParams.get('cam') === 'garden') {
  player.respawn(new THREE.Vector3(-10, 1.2, -4));
  player.yaw = 2.4;
  player.pitch = -0.05;
} else if (urlParams.get('cam') === 'orchard') {
  player.respawn(new THREE.Vector3(15, 1.2, -4));
  player.yaw = -0.85;
  player.pitch = -0.05;
} else if (urlParams.get('cam') === 'blender-tree') {
  player.respawn(new THREE.Vector3(15.8, 1.35, -2.8));
  player.yaw = -0.85;
  player.pitch = 0.16;
} else if (urlParams.get('cam') === 'blender-trunk') {
  player.respawn(new THREE.Vector3(18.6, 1.30, -4.8));
  player.yaw = -0.86;
  player.pitch = 0.38;
} else if (urlParams.get('cam') === 'blender-apples') {
  player.respawn(new THREE.Vector3(19.6, 1.30, -5.3));
  player.yaw = -0.72;
  player.pitch = 0.44;
} else if (urlParams.get('cam') === 'blender-compare') {
  player.respawn(new THREE.Vector3(14.0, 1.30, -3.8));
  player.yaw = -0.92;
  player.pitch = 0.10;
}

const timeParam = urlParams.get('time');
if (timeParam) {
  if (timeParam === 'sunrise' || timeParam === '06:30' || timeParam === '6:30') {
    timeManager.setTime(6, 30);
  } else if (timeParam === 'morning' || timeParam === '08:00' || timeParam === '8:00') {
    timeManager.setTime(8, 0);
  } else if (timeParam === 'midday' || timeParam === '12:00') {
    timeManager.setTime(12, 0);
  } else if (timeParam === 'goldenhour' || timeParam === '17:00') {
    timeManager.setTime(17, 0);
  } else if (timeParam === 'sunset' || timeParam === '18:30') {
    timeManager.setTime(18, 30);
  } else if (timeParam === 'twilight' || timeParam === '19:30') {
    timeManager.setTime(19, 30);
  } else if (timeParam === 'night' || timeParam === '22:30') {
    timeManager.setTime(22, 30);
  } else if (timeParam.includes(':')) {
    const parts = timeParam.split(':').map(Number);
    if (!isNaN(parts[0]) && !isNaN(parts[1])) {
      timeManager.setTime(parts[0], parts[1]);
    }
  }
  // Immediately sync DayNightCycle to chosen test time
  dayNightCycle.update();
}

if (urlParams.has('timescale')) {
  timeManager.setTimeScale(parseFloat(urlParams.get('timescale')));
}

// 10. Main Game Loop
const clock = new THREE.Clock();
let totalTime = 0;

function animate() {
  requestAnimationFrame(animate);

  const rawDt = clock.getDelta();
  const dt = Math.min(rawDt, 0.05);
  totalTime += dt;

  // Authoritative Time & Auto-save Updates
  timeManager.update(dt);
  saveManager.update(dt);

  // Update Game Entities
  player.update(dt, world.interactables);
  world.update(dt, totalTime);
  particleManager.update(dt);

  // Update Farming Grid Targeting
  farmingManager.updateTargeting(player);

  // Update Reticle & Interaction Prompt
  if (farmingManager.targetedTile && farmingManager.targetedTile.promptText) {
    reticle.classList.add('hover');
    interactPrompt.classList.remove('hidden');
    interactText.textContent = farmingManager.targetedTile.promptText;
  } else if (player.hoveredInteractable && player.hoveredInteractable.ready !== false) {
    reticle.classList.add('hover');
    interactPrompt.classList.remove('hidden');
    interactText.textContent = `${player.hoveredInteractable.prompt} [${player.hoveredInteractable.name}]`;
  } else {
    reticle.classList.remove('hover');
    interactPrompt.classList.add('hidden');
  }

  // Update Stamina HUD
  const stamPct = Math.round(player.stamina);
  staminaFill.style.width = `${stamPct}%`;
  staminaText.textContent = `${stamPct}%`;
  if (player.isExhausted) {
    staminaFill.classList.add('exhausted');
  } else {
    staminaFill.classList.remove('exhausted');
  }

  // Update Movement Status Badges
  if (player.onGround) {
    badgeGround.classList.add('active');
    badgeGround.textContent = 'GROUNDED';
  } else {
    badgeGround.classList.remove('active');
    badgeGround.textContent = 'AIRBORNE';
  }

  const horizSpeed = Math.hypot(player.velocity.x, player.velocity.z);
  if (player.keys.crouch) {
    badgeMove.textContent = 'CROUCHING';
    badgeMove.classList.add('active');
  } else if (player.keys.sprint && horizSpeed > 4.5 && player.onGround) {
    badgeMove.textContent = 'JOGGING';
    badgeMove.classList.add('active');
  } else if (horizSpeed > 0.5 && player.onGround) {
    badgeMove.textContent = 'WALKING';
    badgeMove.classList.remove('active');
  } else {
    badgeMove.textContent = 'IDLE';
    badgeMove.classList.remove('active');
  }

  // Render Scene
  renderer.render(scene, camera);
}

// Start Game Loop
animate();
