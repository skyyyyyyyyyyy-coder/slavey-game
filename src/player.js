import * as THREE from 'three';
import { sounds } from './audio.js';

export class Player {
  constructor(camera, collisionWorld, particleManager, scene) {
    this.camera = camera;
    this.world = collisionWorld;
    this.particles = particleManager;
    this.scene = scene;

    // Dimensions
    this.radius = 0.45;
    this.standingHeight = 1.8;
    this.crouchHeight = 1.05;
    this.height = this.standingHeight;

    // Eye levels relative to player base
    this.standingEyeHeight = 1.65;
    this.crouchEyeHeight = 0.90;
    this.currentEyeHeight = this.standingEyeHeight;

    // Position & Physics
    this.position = new THREE.Vector3(0, 1.2, 0);
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.onGround = false;
    this.standingOnPlatform = null;

    // Realistic Simulator Movement Speeds
    this.walkSpeed = 4.4;
    this.sprintSpeed = 7.4;
    this.crouchSpeed = 2.2;
    this.groundAccel = 65.0;
    this.airAccel = 14.0;
    this.friction = 10.0;
    this.gravity = 22.0;
    this.jumpForce = 7.8;

    // Coyote Time & Jump Buffering
    this.coyoteTime = 0.15;
    this.timeSinceGrounded = 0;
    this.jumpBufferTime = 0.15;
    this.timeSinceJumpPressed = 999;

    // Stamina
    this.maxStamina = 100;
    this.stamina = 100;
    this.staminaDrainRate = 22;
    this.staminaRegenRate = 28;
    this.staminaRegenDelay = 0.5;
    this.timeSinceSprint = 0;
    this.isExhausted = false;

    // Camera rotation
    this.pitch = 0;
    this.yaw = 0;
    this.mouseSensitivity = 1.0;
    this.invertY = false;

    // Input state
    this.keys = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      jump: false,
      sprint: false,
      crouch: false,
      zoom: false
    };

    // Camera effects
    this.headBobEnabled = true;
    this.bobTimer = 0;
    this.bobOffset = new THREE.Vector3();
    this.cameraRoll = 0;
    this.landDip = 0;
    this.baseFov = 75;
    this.currentFov = 75;

    // Simulator Interaction System
    this.raycaster = new THREE.Raycaster();
    this.raycaster.far = 4.0;
    this.hoveredInteractable = null;

    // BACKPACK INVENTORY
    this.backpack = [
      { id: 'apple', name: 'Fresh Apple', icon: '🍎', count: 0, description: 'Sweet apple harvested from orchard trees.' },
      { id: 'carrot', name: 'Farm Carrot', icon: '🥕', count: 0, description: 'Crisp organic carrot pulled from the soil.' },
      { id: 'pumpkin', name: 'Country Pumpkin', icon: '🎃', count: 0, description: 'Hearty golden pumpkin from the patch.' },
      { id: 'wheat', name: 'Golden Wheat', icon: '🌾', count: 0, description: 'Sun-ripened wheat bundle from the field.' }
    ];

    // Pure first-person camera mode: no body/hat/backpack mesh in camera view
    this.avatar = null;

    this.setupInputs();
  }

  addToBackpack(itemId, amount = 1) {
    const item = this.backpack.find(i => i.id === itemId);
    if (item) {
      item.count += amount;
      const evt = new CustomEvent('backpack:update', {
        detail: { backpack: this.backpack, added: item }
      });
      window.dispatchEvent(evt);
      return true;
    }
    return false;
  }

  restoreState(savedPlayer) {
    if (!savedPlayer) return;
    if (savedPlayer.position) {
      this.position.set(savedPlayer.position.x, savedPlayer.position.y, savedPlayer.position.z);
    }
    if (typeof savedPlayer.yaw === 'number') this.yaw = savedPlayer.yaw;
    if (typeof savedPlayer.pitch === 'number') this.pitch = savedPlayer.pitch;
    if (typeof savedPlayer.stamina === 'number') this.stamina = savedPlayer.stamina;

    if (savedPlayer.backpack && Array.isArray(savedPlayer.backpack)) {
      savedPlayer.backpack.forEach(savedItem => {
        const item = this.backpack.find(i => i.id === savedItem.id);
        if (item) {
          item.count = savedItem.count;
        }
      });
      const evt = new CustomEvent('backpack:update', {
        detail: { backpack: this.backpack }
      });
      window.dispatchEvent(evt);
    }

    this.camera.position.x = this.position.x;
    this.camera.position.y = this.position.y + this.currentEyeHeight;
    this.camera.position.z = this.position.z;
    this.camera.rotation.set(0, 0, 0);
    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch;

    if (this.avatar) {
      this.avatar.position.copy(this.position);
      this.avatar.rotation.y = this.yaw;
    }
  }

  setupInputs() {
    window.addEventListener('keydown', (e) => this.onKeyDown(e));
    window.addEventListener('keyup', (e) => this.onKeyUp(e));
    window.addEventListener('mousemove', (e) => this.onMouseMove(e));
    window.addEventListener('mousedown', (e) => this.onMouseDown(e));
    window.addEventListener('mouseup', (e) => this.onMouseUp(e));
  }

  onKeyDown(e) {
    switch (e.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.keys.forward = true;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.keys.backward = true;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.keys.left = true;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.keys.right = true;
        break;
      case 'Space':
        if (!this.keys.jump) {
          this.timeSinceJumpPressed = 0;
        }
        this.keys.jump = true;
        e.preventDefault();
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.keys.sprint = true;
        break;
      case 'KeyC':
      case 'ControlLeft':
      case 'ControlRight':
        this.keys.crouch = true;
        break;
      case 'KeyE':
        this.triggerInteraction();
        break;
      case 'KeyB':
      case 'Tab':
        // Toggle backpack inventory modal
        const evt = new CustomEvent('backpack:toggle');
        window.dispatchEvent(evt);
        if (e.code === 'Tab') e.preventDefault();
        break;
    }
  }

  onKeyUp(e) {
    switch (e.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.keys.forward = false;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.keys.backward = false;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.keys.left = false;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.keys.right = false;
        break;
      case 'Space':
        this.keys.jump = false;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.keys.sprint = false;
        break;
      case 'KeyC':
      case 'ControlLeft':
      case 'ControlRight':
        this.keys.crouch = false;
        break;
    }
  }

  onMouseMove(e) {
    if (document.pointerLockElement !== document.body) return;

    const baseSens = 0.002 * this.mouseSensitivity;
    const dy = this.invertY ? e.movementY : -e.movementY;

    this.yaw -= e.movementX * baseSens;
    this.pitch += dy * baseSens;

    const maxPitch = (Math.PI / 2) - 0.03;
    this.pitch = Math.max(-maxPitch, Math.min(maxPitch, this.pitch));
  }

  onMouseDown(e) {
    if (document.pointerLockElement !== document.body) return;

    if (e.button === 0) {
      this.triggerInteraction();
    } else if (e.button === 2) {
      this.keys.zoom = true;
    }
  }

  onMouseUp(e) {
    if (e.button === 2) {
      this.keys.zoom = false;
    }
  }

  triggerInteraction() {
    if (this.hoveredInteractable && this.hoveredInteractable.ready !== false) {
      this.hoveredInteractable.interact(this);
    }
  }

  updateInteractionRaycast(interactables = []) {
    const origin = new THREE.Vector3();
    this.camera.getWorldPosition(origin);
    const direction = new THREE.Vector3();
    this.camera.getWorldDirection(direction);

    this.raycaster.set(origin, direction);

    let closest = null;
    let minDistance = 3.8;

    for (const item of interactables) {
      if (!item.mesh || item.ready === false) continue;

      const box = new THREE.Box3().setFromObject(item.mesh);
      const hitPoint = this.raycaster.ray.intersectBox(box, new THREE.Vector3());
      if (hitPoint) {
        const d = origin.distanceTo(hitPoint);
        if (d < minDistance) {
          minDistance = d;
          closest = item;
        }
      }
    }

    this.hoveredInteractable = closest;
  }

  update(dt, interactables = []) {
    this.timeSinceJumpPressed += dt;
    this.timeSinceSprint += dt;

    // 1. Stamina & Running
    let isMoving = this.keys.forward || this.keys.backward || this.keys.left || this.keys.right;
    let isSprinting = this.keys.sprint && isMoving && !this.keys.crouch && !this.isExhausted && this.onGround;

    if (isSprinting) {
      this.timeSinceSprint = 0;
      this.stamina = Math.max(0, this.stamina - this.staminaDrainRate * dt);
      if (this.stamina === 0) {
        this.isExhausted = true;
      }
    } else {
      if (this.timeSinceSprint > this.staminaRegenDelay) {
        this.stamina = Math.min(this.maxStamina, this.stamina + this.staminaRegenRate * dt);
        if (this.isExhausted && this.stamina > 25) {
          this.isExhausted = false;
        }
      }
    }

    // 2. Smooth Crouch
    const isCrouching = this.keys.crouch;
    this.height = isCrouching ? this.crouchHeight : this.standingHeight;
    const targetEyeHeight = isCrouching ? this.crouchEyeHeight : this.standingEyeHeight;
    this.currentEyeHeight += (targetEyeHeight - this.currentEyeHeight) * Math.min(1.0, 12.0 * dt);

    // 3. Target Speed
    let targetSpeed = this.walkSpeed;
    if (isCrouching) {
      targetSpeed = this.crouchSpeed;
    } else if (isSprinting) {
      targetSpeed = this.sprintSpeed;
    }

    // 4. Movement Input Vector
    const moveDir = new THREE.Vector3(0, 0, 0);
    if (this.keys.forward) moveDir.z -= 1;
    if (this.keys.backward) moveDir.z += 1;
    if (this.keys.left) moveDir.x -= 1;
    if (this.keys.right) moveDir.x += 1;

    if (moveDir.lengthSq() > 0) {
      moveDir.normalize();
      moveDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
    }

    // 5. Ground / Air Physics
    if (this.onGround) {
      this.timeSinceGrounded = 0;

      const horizVel = new THREE.Vector2(this.velocity.x, this.velocity.z);
      const currentHorizSpeed = horizVel.length();

      if (currentHorizSpeed > 0) {
        const drop = currentHorizSpeed * this.friction * dt;
        const newSpeed = Math.max(0, currentHorizSpeed - drop);
        if (currentHorizSpeed > 0) {
          horizVel.multiplyScalar(newSpeed / currentHorizSpeed);
          this.velocity.x = horizVel.x;
          this.velocity.z = horizVel.y;
        }
      }

      if (moveDir.lengthSq() > 0) {
        const accel = this.groundAccel;
        this.velocity.x += moveDir.x * accel * dt;
        this.velocity.z += moveDir.z * accel * dt;

        const currentSpeed = Math.hypot(this.velocity.x, this.velocity.z);
        if (currentSpeed > targetSpeed) {
          const scale = targetSpeed / currentSpeed;
          this.velocity.x *= scale;
          this.velocity.z *= scale;
        }
      }
    } else {
      this.timeSinceGrounded += dt;

      if (moveDir.lengthSq() > 0) {
        const accel = this.airAccel;
        this.velocity.x += moveDir.x * accel * dt;
        this.velocity.z += moveDir.z * accel * dt;

        const horizSpeed = Math.hypot(this.velocity.x, this.velocity.z);
        const maxAirSpeed = Math.max(targetSpeed, 5.0);
        if (horizSpeed > maxAirSpeed) {
          const ratio = maxAirSpeed / horizSpeed;
          this.velocity.x *= ratio;
          this.velocity.z *= ratio;
        }
      }

      this.velocity.y -= this.gravity * dt;
      this.velocity.y = Math.max(-30.0, this.velocity.y);
    }

    // 6. Jump Logic
    const canCoyoteJump = (this.timeSinceGrounded < this.coyoteTime);
    const wantsToJump = (this.timeSinceJumpPressed < this.jumpBufferTime);

    if (canCoyoteJump && wantsToJump) {
      this.velocity.y = this.jumpForce;
      this.onGround = false;
      this.timeSinceGrounded = 1.0;
      this.timeSinceJumpPressed = 999;
      sounds.playJump();
    }

    // 7. Resolve collision
    const preVelY = this.velocity.y;
    const { wasGrounded, isGrounded } = this.world.resolveMovement(this, dt);

    if (!wasGrounded && isGrounded && preVelY < -2.0) {
      const impact = Math.abs(preVelY);
      sounds.playLand(impact);
      this.landDip = Math.min(0.18, impact * 0.012);
    }
    this.landDip += (0 - this.landDip) * Math.min(1.0, 10.0 * dt);

    // 8. Head Bobbing & Footsteps
    const horizontalSpeed = Math.hypot(this.velocity.x, this.velocity.z);
    if (this.onGround && horizontalSpeed > 0.4 && this.headBobEnabled) {
      const bobFreq = isSprinting ? 10.5 : 7.5;
      const prevBob = Math.sin(this.bobTimer);
      this.bobTimer += dt * bobFreq;
      const curBob = Math.sin(this.bobTimer);

      if (prevBob > 0 && curBob <= 0) {
        sounds.playFootstep(isSprinting);
      }

      const bobAmp = isSprinting ? 0.045 : 0.028;
      this.bobOffset.y = Math.sin(this.bobTimer) * bobAmp;
      this.bobOffset.x = Math.cos(this.bobTimer * 0.5) * (bobAmp * 0.5);
    } else {
      this.bobOffset.lerp(new THREE.Vector3(0, 0, 0), 10.0 * dt);
      if (!this.onGround) {
        this.bobTimer = 0;
      }
    }

    // 9. Camera Strafe Tilt
    let targetRoll = 0;
    if (this.keys.left) targetRoll += 0.012;
    if (this.keys.right) targetRoll -= 0.012;
    this.cameraRoll += (targetRoll - this.cameraRoll) * Math.min(1.0, 10.0 * dt);

    // 10. Dynamic FOV
    let targetFov = this.baseFov;
    if (this.keys.zoom) {
      targetFov = 50;
    } else if (isSprinting) {
      targetFov = 80;
    }
    this.currentFov += (targetFov - this.currentFov) * Math.min(1.0, 8.0 * dt);
    if (Math.abs(this.camera.fov - this.currentFov) > 0.01) {
      this.camera.fov = this.currentFov;
      this.camera.updateProjectionMatrix();
    }

    // 11. Update Camera Position & Rotation
    this.camera.position.x = this.position.x + this.bobOffset.x;
    this.camera.position.y = this.position.y + this.currentEyeHeight + this.bobOffset.y - this.landDip;
    this.camera.position.z = this.position.z;

    this.camera.rotation.set(0, 0, 0);
    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch;
    this.camera.rotation.z = this.cameraRoll;

    // 12. Update 3D Player Avatar Position & Shadow
    if (this.avatar) {
      this.avatar.position.copy(this.position);
      this.avatar.rotation.y = this.yaw;
      const crouchRatio = this.height / this.standingHeight;
      this.avatar.scale.set(1, crouchRatio, 1);
    }

    // Void fall check
    if (this.position.y < -15) {
      this.respawn(new THREE.Vector3(0, 1.2, 0));
    }

    // 13. Update Simulator Interaction Raycasting
    this.updateInteractionRaycast(interactables);
  }

  respawn(spawnPos = new THREE.Vector3(0, 1.2, 0)) {
    this.position.copy(spawnPos);
    this.velocity.set(0, 0, 0);
    this.yaw = 0;
    this.pitch = 0;
    this.onGround = false;
    this.timeSinceGrounded = 0;
    this.timeSinceJumpPressed = 999;
  }
}
