/**
 * A tiny localStorage-backed store that React can subscribe to with
 * `useSyncExternalStore`. Reads fall back to the default on the server and
 * whenever storage is unavailable or holds something unexpected.
 */
export type LocalStore<T> = {
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => T;
  getServerSnapshot: () => T;
  set: (value: T) => void;
};

export function createLocalStore<T>(
  key: string,
  fallback: T,
  sanitize: (raw: unknown) => T,
): LocalStore<T> {
  const listeners = new Set<() => void>();
  let cachedRaw: string | null | undefined;
  let cachedValue = fallback;

  function read(): T {
    let raw: string | null = null;
    try {
      raw = window.localStorage.getItem(key);
    } catch {
      // Private mode or blocked storage. Use the default.
    }
    // Return the same object until the stored text changes.
    if (raw === cachedRaw) return cachedValue;
    cachedRaw = raw;
    try {
      cachedValue = raw === null ? fallback : sanitize(JSON.parse(raw));
    } catch {
      cachedValue = fallback;
    }
    return cachedValue;
  }

  function emit() {
    listeners.forEach((listener) => listener());
  }

  function onStorage(event: StorageEvent) {
    if (event.key === key || event.key === null) emit();
  }

  return {
    subscribe(listener) {
      if (listeners.size === 0) window.addEventListener("storage", onStorage);
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
        if (listeners.size === 0) {
          window.removeEventListener("storage", onStorage);
        }
      };
    },
    getSnapshot: read,
    getServerSnapshot: () => fallback,
    set(value) {
      try {
        window.localStorage.setItem(key, JSON.stringify(value));
      } catch {
        // Could not save. Keep the value for this session only.
        cachedRaw = undefined;
        cachedValue = value;
      }
      emit();
    },
  };
}
