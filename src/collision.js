import * as THREE from 'three';

/**
 * Robust Axis-Aligned Bounding Box (AABB) and Ramp collision solver
 * Supports wall sliding, step climbing, ramps, moving platforms, and trigger volumes.
 */
export class CollisionWorld {
  constructor() {
    this.colliders = []; // Static obstacle boxes { min: THREE.Vector3, max: THREE.Vector3 }
    this.cylinders = []; // Radial obstacle cylinders { x, z, radius, height }
    this.ramps = [];     // { xMin, xMax, zMin, zMax, yStart, yEnd, axis }
    this.triggers = [];  // { box, onEnter, type, id, data }
    this.movingPlatforms = []; // { mesh, min, max, velocity, update(dt) }
  }

  addCylinderCollider(x, z, radius, height = 12, minY = 0) {
    const cylinder = { x, z, radius, height, minY };
    this.cylinders.push(cylinder);

    // Register matching AABB for broadphase queries
    const box = new THREE.Box3(
      new THREE.Vector3(x - radius, minY, z - radius),
      new THREE.Vector3(x + radius, minY + height, z + radius)
    );
    this.colliders.push({ box, type: 'solid', isCylinder: true });
    return cylinder;
  }

  addBoxCollider(mesh, padding = 0) {
    mesh.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(mesh);
    if (padding !== 0) {
      box.min.subScalar(padding);
      box.max.addScalar(padding);
    }
    const collider = {
      box,
      mesh,
      type: mesh.userData.type || 'solid'
    };
    this.colliders.push(collider);
    return collider;
  }

  addRamp(xMin, xMax, zMin, zMax, yStart, yEnd, axis = 'z') {
    this.ramps.push({
      xMin, xMax, zMin, zMax,
      yStart, yEnd, axis
    });
  }

  addTrigger(box, type, callback, data = {}) {
    this.triggers.push({
      box,
      type,
      callback,
      data,
      active: true
    });
  }

  addMovingPlatform(platform) {
    this.movingPlatforms.push(platform);
  }

  /**
   * Resolves player movement with independent X/Z sliding, Y gravity/grounding, and step-climb.
   * player: { position, radius, height, isCrouching, onGround, velocity }
   */
  resolveMovement(player, dt) {
    const halfSize = player.radius;
    const height = player.height;
    const stepHeight = 0.35; // Maximum step player can smoothly walk over
    const footOffset = 0.08; // Height above feet to start checking horizontal walls (prevents floor collision)

    // 1. Check moving platforms first - if standing on one, inherit position delta
    for (const plat of this.movingPlatforms) {
      plat.update(dt);
      if (player.standingOnPlatform === plat) {
        player.position.add(plat.deltaMovement);
      }
    }

    // 2. Resolve Y movement (Gravity, vertical jumps, falling)
    player.position.y += player.velocity.y * dt;
    let wasGrounded = player.onGround;
    player.onGround = false;
    player.standingOnPlatform = null;

    // Check ramps first
    for (const ramp of this.ramps) {
      if (player.position.x >= ramp.xMin - halfSize && player.position.x <= ramp.xMax + halfSize &&
          player.position.z >= ramp.zMin - halfSize && player.position.z <= ramp.zMax + halfSize) {
        let t;
        if (ramp.axis === 'z') {
          t = (player.position.z - ramp.zMin) / (ramp.zMax - ramp.zMin);
        } else {
          t = (player.position.x - ramp.xMin) / (ramp.xMax - ramp.xMin);
        }
        t = Math.max(0, Math.min(1, t));
        const rampY = ramp.yStart + t * (ramp.yEnd - ramp.yStart);

        if (player.position.y <= rampY + 0.3 && player.position.y >= rampY - 0.6) {
          player.position.y = rampY;
          if (player.velocity.y <= 0) {
            player.velocity.y = 0;
            player.onGround = true;
          }
          break;
        }
      }
    }

    // Check box colliders on Y
    if (!player.onGround) {
      const playerYBox = new THREE.Box3(
        new THREE.Vector3(player.position.x - halfSize * 0.85, player.position.y, player.position.z - halfSize * 0.85),
        new THREE.Vector3(player.position.x + halfSize * 0.85, player.position.y + height, player.position.z + halfSize * 0.85)
      );

      for (const col of this.colliders) {
        if (playerYBox.intersectsBox(col.box)) {
          if (player.velocity.y <= 0) {
            // Landing on top of surface
            // Only land if player's bottom is near or above top of collider
            if (player.position.y >= col.box.max.y - 0.45) {
              player.position.y = col.box.max.y;
              player.velocity.y = 0;
              player.onGround = true;

              // Check if collider belongs to a moving platform
              const movingPlat = this.movingPlatforms.find(p => p.collider === col);
              if (movingPlat) {
                player.standingOnPlatform = movingPlat;
              }
              break;
            }
          } else if (player.velocity.y > 0) {
            // Head hitting ceiling
            if (player.position.y + height <= col.box.min.y + 0.45) {
              player.position.y = col.box.min.y - height - 0.001;
              player.velocity.y = 0;
              break;
            }
          }
        }
      }
    }

    // 3. Resolve X movement (Walls and Steps)
    if (player.velocity.x !== 0) {
      const prevX = player.position.x;
      player.position.x += player.velocity.x * dt;

      // Note: playerXBox starts at player.position.y + footOffset!
      // This strictly excludes the floor surface beneath feet from being treated as a wall!
      const playerXBox = new THREE.Box3(
        new THREE.Vector3(player.position.x - halfSize, player.position.y + footOffset, player.position.z - halfSize * 0.85),
        new THREE.Vector3(player.position.x + halfSize, player.position.y + height, player.position.z + halfSize * 0.85)
      );

      for (const col of this.colliders) {
        if (col.isCylinder) continue;
        // Skip obstacles that are below foot level or above head level
        if (col.box.max.y <= player.position.y + footOffset || col.box.min.y >= player.position.y + height) {
          continue;
        }

        if (playerXBox.intersectsBox(col.box)) {
          // Check for step-up: is the obstacle low enough to step over?
          const stepDiff = col.box.max.y - player.position.y;
          if (player.onGround && stepDiff > 0 && stepDiff <= stepHeight) {
            // Check overhead clearance before stepping up
            const overheadBox = new THREE.Box3(
              new THREE.Vector3(player.position.x - halfSize, col.box.max.y, player.position.z - halfSize),
              new THREE.Vector3(player.position.x + halfSize, col.box.max.y + height, player.position.z + halfSize)
            );
            let overheadBlocked = false;
            for (const other of this.colliders) {
              if (other !== col && overheadBox.intersectsBox(other.box)) {
                overheadBlocked = true;
                break;
              }
            }
            if (!overheadBlocked) {
              player.position.y = col.box.max.y;
              continue;
            }
          }

          // Wall collision: slide along X without teleporting
          if (player.velocity.x > 0) {
            player.position.x = Math.min(prevX, col.box.min.x - halfSize - 0.001);
          } else if (player.velocity.x < 0) {
            player.position.x = Math.max(prevX, col.box.max.x + halfSize + 0.001);
          }
          player.velocity.x = 0;
          break;
        }
      }
    }

    // 4. Resolve Z movement (Walls and Steps)
    if (player.velocity.z !== 0) {
      const prevZ = player.position.z;
      player.position.z += player.velocity.z * dt;

      // Note: playerZBox starts at player.position.y + footOffset!
      const playerZBox = new THREE.Box3(
        new THREE.Vector3(player.position.x - halfSize * 0.85, player.position.y + footOffset, player.position.z - halfSize),
        new THREE.Vector3(player.position.x + halfSize * 0.85, player.position.y + height, player.position.z + halfSize)
      );

      for (const col of this.colliders) {
        if (col.isCylinder) continue;
        // Skip obstacles below feet or above head
        if (col.box.max.y <= player.position.y + footOffset || col.box.min.y >= player.position.y + height) {
          continue;
        }

        if (playerZBox.intersectsBox(col.box)) {
          // Check for step-up on Z
          const stepDiff = col.box.max.y - player.position.y;
          if (player.onGround && stepDiff > 0 && stepDiff <= stepHeight) {
            const overheadBox = new THREE.Box3(
              new THREE.Vector3(player.position.x - halfSize, col.box.max.y, player.position.z - halfSize),
              new THREE.Vector3(player.position.x + halfSize, col.box.max.y + height, player.position.z + halfSize)
            );
            let overheadBlocked = false;
            for (const other of this.colliders) {
              if (other !== col && overheadBox.intersectsBox(other.box)) {
                overheadBlocked = true;
                break;
              }
            }
            if (!overheadBlocked) {
              player.position.y = col.box.max.y;
              continue;
            }
          }

          // Wall collision: slide along Z without teleporting
          if (player.velocity.z > 0) {
            player.position.z = Math.min(prevZ, col.box.min.z - halfSize - 0.001);
          } else if (player.velocity.z < 0) {
            player.position.z = Math.max(prevZ, col.box.max.z + halfSize + 0.001);
          }
          player.velocity.z = 0;
          break;
        }
      }
    }

    // 4.5. Resolve Accurate Radial Cylinder Collisions (Tree trunks, wooden posts)
    // Guarantees true circular hitboxes and smooth tangential sliding without corner snagging
    for (const cyl of this.cylinders) {
      const cylMinY = cyl.minY || 0;
      if (player.position.y + footOffset >= cylMinY + cyl.height || player.position.y + height <= cylMinY) {
        continue;
      }
      const dx = player.position.x - cyl.x;
      const dz = player.position.z - cyl.z;
      const distSq = dx * dx + dz * dz;
      const minDist = halfSize + cyl.radius;

      if (distSq < minDist * minDist) {
        const dist = Math.sqrt(distSq);
        if (dist > 0.0001) {
          const nx = dx / dist;
          const nz = dz / dist;
          const penetration = minDist - dist;
          player.position.x += nx * penetration;
          player.position.z += nz * penetration;

          // Slide velocity along cylinder tangent so player smoothly glides around the round trunk
          const normalVel = player.velocity.x * nx + player.velocity.z * nz;
          if (normalVel < 0) {
            player.velocity.x -= normalVel * nx;
            player.velocity.z -= normalVel * nz;
          }
        }
      }
    }

    // 5. Ground stickiness probe (prevents jitter when walking down stairs/slopes)
    if (wasGrounded && !player.onGround && player.velocity.y <= 0) {
      const snapBox = new THREE.Box3(
        new THREE.Vector3(player.position.x - halfSize * 0.5, player.position.y - 0.12, player.position.z - halfSize * 0.5),
        new THREE.Vector3(player.position.x + halfSize * 0.5, player.position.y, player.position.z + halfSize * 0.5)
      );
      for (const col of this.colliders) {
        if (snapBox.intersectsBox(col.box)) {
          player.position.y = col.box.max.y;
          player.velocity.y = 0;
          player.onGround = true;
          break;
        }
      }
    }

    // 6. Check Triggers (collectibles, jump pads, teleporters)
    const playerTriggerBox = new THREE.Box3(
      new THREE.Vector3(player.position.x - halfSize, player.position.y, player.position.z - halfSize),
      new THREE.Vector3(player.position.x + halfSize, player.position.y + height, player.position.z + halfSize)
    );

    for (let i = this.triggers.length - 1; i >= 0; i--) {
      const tr = this.triggers[i];
      if (!tr.active) continue;

      if (playerTriggerBox.intersectsBox(tr.box)) {
        tr.callback(tr, player);
      }
    }

    return { wasGrounded, isGrounded: player.onGround };
  }
}
