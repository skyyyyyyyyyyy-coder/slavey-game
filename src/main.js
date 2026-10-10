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

// Wire save state provider
saveManager.registerStateProvider(() => ({
  player,
  world,
  timeManager,
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
window.timeManager = timeManager;
window.dayNightCycle = dayNightCycle;
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
const modalAppleCount = document.getElementById('modal-apple-count');
const modalCarrotCount = document.getElementById('modal-carrot-count');
const modalPumpkinCount = document.getElementById('modal-pumpkin-count');
const modalWheatCount = document.getElementById('modal-wheat-count');

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

// 6. Backpack Inventory UI Updates
function updateBackpackUI(backpack) {
  backpack.forEach((item) => {
    if (item.id === 'apple') {
      countApple.textContent = item.count;
      modalAppleCount.textContent = `Count: ${item.count}`;
      document.getElementById('slot-apple').classList.toggle('has-item', item.count > 0);
    } else if (item.id === 'carrot') {
      countCarrot.textContent = item.count;
      modalCarrotCount.textContent = `Count: ${item.count}`;
      document.getElementById('slot-carrot').classList.toggle('has-item', item.count > 0);
    } else if (item.id === 'pumpkin') {
      countPumpkin.textContent = item.count;
      modalPumpkinCount.textContent = `Count: ${item.count}`;
      document.getElementById('slot-pumpkin').classList.toggle('has-item', item.count > 0);
    } else if (item.id === 'wheat') {
      countWheat.textContent = item.count;
      modalWheatCount.textContent = `Count: ${item.count}`;
      document.getElementById('slot-wheat').classList.toggle('has-item', item.count > 0);
    }
  });
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

// 7. Save / Load & Menu Management
function applySaveData(saveData) {
  if (!saveData) return false;
  if (saveData.player) player.restoreState(saveData.player);
  if (saveData.world) world.restoreCropsAndFruits(saveData.world.crops, saveData.world.fruits);
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
  isGameStarted = true;
  startOverlay.classList.add('hidden');
  lockPointer();
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
}
if (urlParams.has('continue')) {
  const loaded = saveManager.load();
  if (loaded) applySaveData(loaded);
  isGameStarted = true;
  startOverlay.classList.add('hidden');
}
if (urlParams.get('cam') === 'garden') {
  player.respawn(new THREE.Vector3(-10, 1.2, -4));
  player.yaw = 2.4;
  player.pitch = -0.05;
} else if (urlParams.get('cam') === 'orchard') {
  player.respawn(new THREE.Vector3(15, 1.2, -4));
  player.yaw = -0.85;
  player.pitch = -0.05;
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

  // Update Reticle & Interaction Prompt
  if (player.hoveredInteractable && player.hoveredInteractable.ready !== false) {
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
