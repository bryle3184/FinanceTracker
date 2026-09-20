// @ts-check
import { createJSONStorage } from 'zustand/middleware';
import { migrate, SCHEMA_VERSION } from './migrations.js';

export const STORAGE_KEY = 'finance-tracker:v1';
const FLUSH_DELAY_MS = 250;

/**
 * A mini wrapper around localStorage's JSON storage that debounces writes and
 * flushes on pagehide/blur/visibility hidden so nothing is lost on tab close
 * while typing in the quick-entry modal.
 */
function createDebouncedJSONStorage(getStorage = () => localStorage) {
  let timer = null;
  let pending = null;

  const raw = {
    getItem: (name) => {
      const storage = getStorage();
      if (!storage) return null;
      return storage.getItem(name);
    },
    setItem: (name, value) => {
      pending = { name, value };
      if (timer != null) return;
      timer = setTimeout(flush, FLUSH_DELAY_MS);
    },
    removeItem: (name) => {
      const storage = getStorage();
      if (!storage) return;
      storage.removeItem(name);
      pending = null;
    }
  };

  function flush() {
    if (timer != null) {
      clearTimeout(timer);
      timer = null;
    }
    if (pending) {
      const { name, value } = pending;
      const storage = getStorage();
      try {
        if (storage) storage.setItem(name, value);
      } catch {
        // quota / private mode — fail silently, memory state is still live
      }
      pending = null;
    }
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('pagehide', () => flush());
    window.addEventListener('blur', () => flush());
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') flush();
    });
  }

  return raw;
}

/**
 * Zustand persist storage token. Use in the store as:
 *   persist(config, { name: STORAGE_KEY, storage: persistStorage, version: SCHEMA_VERSION, migrate })
 */
export const persistStorage = createJSONStorage(() => createDebouncedJSONStorage());
export { migrate, SCHEMA_VERSION };