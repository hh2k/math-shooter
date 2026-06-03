const listeners = {};

export const EventBus = {
  on(event, fn) {
    (listeners[event] = listeners[event] || []).push(fn);
  },
  off(event, fn) {
    if (!listeners[event]) return;
    listeners[event] = listeners[event].filter(f => f !== fn);
  },
  emit(event, data) {
    (listeners[event] || []).forEach(fn => fn(data));
  },
  clear() {
    Object.keys(listeners).forEach(k => delete listeners[k]);
  }
};
