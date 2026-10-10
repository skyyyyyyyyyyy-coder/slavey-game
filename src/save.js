import { events } from './events.js';

export const CURRENT_SAVE_VERSION = 1;
export const SAVE_KEY = 'meadow_valley_save_v1';
export const BACKUP_KEY = 'meadow_valley_save_corrupt_backup';

/**
 * Robust, Versioned SaveManager for Meadow Valley Simulator
 * Handles persistence, auto-saving, schema migrations, and corrupt data recovery.
 */
export class SaveManager {
  constructor(options = {}) {
    this.storageKey = options.storageKey || SAVE_KEY;
    this.autoSaveInterval = options.autoSaveInterval || 30.0; // seconds
    this.autoSaveTimer = 0;
    this.isAutoSaveEnabled = true;

    this.gameStateProvider = null; // Callback returning { player, world, timeManager, settings }
    this.lastSavedTimestamp = null;

    this.setupLifecycleHooks();
  }

  /**
   * Register authoritative provider for game state components
   * @param {Function} provider 
   */
  registerStateProvider(provider) {
    this.gameStateProvider = provider;
  }

  /**
   * Check if valid save data exists
   * @returns {boolean}
   */
  hasSaveData() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return false;
      const parsed = JSON.parse(raw);
      return !!(parsed && parsed.schemaVersion && parsed.player && parsed.time);
    } catch {
      return false;
    }
  }

  /**
   * Delete save data (for New Farm)
   */
  deleteSave() {
    try {
      localStorage.removeItem(this.storageKey);
      this.lastSavedTimestamp = null;
      events.emit('save:deleted');
      return true;
    } catch (err) {
      console.error('Failed to delete save data:', err);
      return false;
    }
  }

  /**
   * Serialize game state into a versioned JSON payload
   * Strictly POJO - No Three.js instances serialized directly!
   */
  createSavePayload() {
    if (!this.gameStateProvider) return null;
    const { player, world, timeManager, settings } = this.gameStateProvider();

    // 1. Player Data
    const playerData = {
      position: {
        x: Number(player.position.x.toFixed(3)),
        y: Number(player.position.y.toFixed(3)),
        z: Number(player.position.z.toFixed(3))
      },
      yaw: Number(player.yaw.toFixed(4)),
      pitch: Number(player.pitch.toFixed(4)),
      stamina: Number(player.stamina.toFixed(1)),
      backpack: player.backpack.map(item => ({
        id: item.id,
        count: item.count
      }))
    };

    // 2. World Crop & Fruit State
    const cropsState = {};
    if (world && world.cropPlants) {
      world.cropPlants.forEach(crop => {
        if (crop.id) {
          cropsState[crop.id] = {
            ready: !!crop.ready,
            growTimer: Number((crop.growTimer || 0).toFixed(2))
          };
        }
      });
    }

    const fruitsState = {};
    if (world && world.fruitTrees) {
      world.fruitTrees.forEach(tree => {
        if (tree.fruits) {
          tree.fruits.forEach(fruit => {
            if (fruit.id) {
              fruitsState[fruit.id] = {
                ready: !!fruit.ready,
                growTimer: Number((fruit.growTimer || 0).toFixed(2))
              };
            }
          });
        }
      });
    }

    // 3. Time Data
    const timeData = timeManager ? timeManager.serialize() : null;

    // 4. Future Compatible Economy & Farm Progression
    const economyData = {
      gold: 150,
      farmLevel: 1,
      totalHarvests: 0
    };

    // 5. Settings Data
    const settingsData = settings || {
      mouseSensitivity: player.mouseSensitivity,
      headBobEnabled: player.headBobEnabled,
      invertY: player.invertY
    };

    return {
      schemaVersion: CURRENT_SAVE_VERSION,
      savedAt: Date.now(),
      savedAtISO: new Date().toISOString(),
      player: playerData,
      world: {
        crops: cropsState,
        fruits: fruitsState
      },
      time: timeData,
      economy: economyData,
      settings: settingsData
    };
  }

  /**
   * Save current game progress
   * @param {string} triggerReason e.g. 'manual', 'autosave', 'harvest', 'lifecycle'
   */
  save(triggerReason = 'manual') {
    try {
      const payload = this.createSavePayload();
      if (!payload) return false;

      const serialized = JSON.stringify(payload);
      localStorage.setItem(this.storageKey, serialized);
      this.lastSavedTimestamp = payload.savedAt;

      events.emit('save:success', {
        timestamp: this.lastSavedTimestamp,
        reason: triggerReason
      });

      return true;
    } catch (err) {
      console.error('Save failed:', err);
      events.emit('save:error', { error: err.message, reason: triggerReason });
      return false;
    }
  }

  /**
   * Load and parse save data with version migration & corruption recovery
   * @returns {Object|null}
   */
  load() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return null;

      let data;
      try {
        data = JSON.parse(raw);
      } catch (parseErr) {
        console.warn('Save data is corrupt JSON! Backing up and resetting.', parseErr);
        localStorage.setItem(BACKUP_KEY, raw);
        events.emit('save:corrupt_recovered', { backupKey: BACKUP_KEY });
        return null;
      }

      if (!data || typeof data !== 'object') {
        return null;
      }

      // Schema Migration Pipeline
      data = this.migrate(data);

      events.emit('save:loaded', {
        timestamp: data.savedAt,
        schemaVersion: data.schemaVersion
      });

      return data;
    } catch (err) {
      console.error('Failed to load save data:', err);
      return null;
    }
  }

  /**
   * Migrate save data to current schema version
   * @param {Object} data 
   * @returns {Object} Migrated data
   */
  migrate(data) {
    let current = { ...data };

    if (!current.schemaVersion) {
      current.schemaVersion = 1;
    }

    // Future version migrations can be chained here:
    // if (current.schemaVersion === 1 && CURRENT_SAVE_VERSION > 1) {
    //   current = migrateV1ToV2(current);
    // }

    return current;
  }

  /**
   * Update timer for automatic periodic saving
   * @param {number} dt Delta time in seconds
   */
  update(dt) {
    if (!this.isAutoSaveEnabled) return;
    this.autoSaveTimer += dt;
    if (this.autoSaveTimer >= this.autoSaveInterval) {
      this.autoSaveTimer = 0;
      this.save('autosave');
    }
  }

  /**
   * Bind page lifecycle listeners to protect against data loss
   */
  setupLifecycleHooks() {
    if (typeof window !== 'undefined') {
      // Save on beforeunload
      window.addEventListener('beforeunload', () => {
        this.save('lifecycle_beforeunload');
      });

      // Save on pagehide (mobile & modern browsers)
      window.addEventListener('pagehide', () => {
        this.save('lifecycle_pagehide');
      });
    }

    if (typeof document !== 'undefined') {
      // Save when user switches tabs or minimizes window
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          this.save('lifecycle_hidden');
        }
      });
    }

    // Save when important game actions occur
    events.on('crop:harvested', () => {
      this.save('harvest');
    });

    events.on('time:day_changed', () => {
      this.save('day_rollover');
    });
  }
}

export const saveManager = new SaveManager();
