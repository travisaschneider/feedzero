/**
 * Simple pub/sub event bus with wildcard support.
 * Returns unsubscribe functions for easy cleanup.
 */

type EventCallback = (data: unknown, event: string) => void;

export interface EventBus {
  on: (event: string, callback: EventCallback) => () => void;
  off: (event: string, callback: EventCallback) => void;
  emit: (event: string, data?: unknown) => void;
  clear: () => void;
}

export function createEventBus(): EventBus {
  const listeners = new Map<string, Set<EventCallback>>();

  function on(event: string, callback: EventCallback) {
    if (!listeners.has(event)) {
      listeners.set(event, new Set());
    }
    listeners.get(event)!.add(callback);
    return () => off(event, callback);
  }

  function off(event: string, callback: EventCallback) {
    const set = listeners.get(event);
    if (set) {
      set.delete(callback);
      if (set.size === 0) listeners.delete(event);
    }
  }

  function emit(event: string, data?: unknown) {
    const set = listeners.get(event);
    if (set) {
      for (const cb of set) cb(data, event);
    }
    // Wildcard listeners
    const wildcard = listeners.get("*");
    if (wildcard) {
      for (const cb of wildcard) cb(data, event);
    }
  }

  function clear() {
    listeners.clear();
  }

  return { on, off, emit, clear };
}
