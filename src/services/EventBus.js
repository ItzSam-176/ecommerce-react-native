// Simple event bus for intra-app pub/sub. Small, dependency-free.
const listeners = new Map();

export const EventBus = {
  on(event, cb) {
    if (!listeners.has(event)) listeners.set(event, new Set());
    listeners.get(event).add(cb);
    return () => EventBus.off(event, cb);
  },
  off(event, cb) {
    if (!listeners.has(event)) return;
    listeners.get(event).delete(cb);
    if (listeners.get(event).size === 0) listeners.delete(event);
  },
  emit(event, payload) {
    if (!listeners.has(event)) return;
    // copy to avoid mutation during iteration
    const copy = Array.from(listeners.get(event));
    for (const cb of copy) {
      try {
        cb(payload);
      } catch (e) {
        // swallow to avoid breaking other listeners
        console.error('EventBus listener error', e);
      }
    }
  },
};

export default EventBus;
