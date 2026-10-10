/**
 * Centralized EventHub for decoupled system communication in Meadow Valley Simulator
 */
export class EventHub {
  constructor() {
    this.listeners = new Map();
  }

  /**
   * Subscribe to an event
   * @param {string} event 
   * @param {Function} handler 
   * @returns {Function} Unsubscribe function
   */
  on(event, handler) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(handler);
    return () => this.off(event, handler);
  }

  /**
   * Subscribe to an event only once
   * @param {string} event 
   * @param {Function} handler 
   */
  once(event, handler) {
    const wrapper = (data) => {
      this.off(event, wrapper);
      handler(data);
    };
    this.on(event, wrapper);
  }

  /**
   * Unsubscribe from an event
   * @param {string} event 
   * @param {Function} handler 
   */
  off(event, handler) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(handler);
    }
  }

  /**
   * Emit an event to all subscribers
   * @param {string} event 
   * @param {*} data 
   */
  emit(event, data) {
    if (this.listeners.has(event)) {
      for (const handler of this.listeners.get(event)) {
        try {
          handler(data);
        } catch (err) {
          console.error(`Error in EventHub handler for "${event}":`, err);
        }
      }
    }
  }

  /**
   * Clear all event listeners
   */
  clear() {
    this.listeners.clear();
  }
}

export const events = new EventHub();
