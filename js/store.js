/** Кэш с TTL поверх web storage и маленькое реактивное хранилище состояния. */

const PREFIX = 'spkz:';
const area = (name) => { try { return name === 'local' ? localStorage : sessionStorage; } catch { return null; } };

export const cache = {
  /** @param {string} key @param {'session'|'local'} [a] */
  get(key, a = 'session') {
    const s = area(a);
    if (!s) return null;
    try {
      const raw = s.getItem(PREFIX + key);
      if (!raw) return null;
      const { v, e } = JSON.parse(raw);
      if (e && e < Date.now()) { s.removeItem(PREFIX + key); return null; }
      return v;
    } catch { return null; }
  },
  /** @param {string} key @param {any} value @param {number} [ttlMs] 0 = без срока @param {'session'|'local'} [a] */
  set(key, value, ttlMs = 0, a = 'session') {
    const s = area(a);
    if (!s) return false;
    try { s.setItem(PREFIX + key, JSON.stringify({ v: value, e: ttlMs ? Date.now() + ttlMs : 0 })); return true; } catch { return false; }
  },
  /** @param {string} key @param {'session'|'local'} [a] */
  del(key, a = 'session') { try { area(a)?.removeItem(PREFIX + key); } catch { /* storage недоступен */ } },
};

/**
 * Простое хранилище: get(), set(patch), subscribe(fn) → отписка.
 * @template T
 * @param {T} initial
 */
export function createStore(initial) {
  let state = initial;
  const subs = new Set();
  return {
    get: () => state,
    set(patch) { state = { ...state, ...patch }; subs.forEach((fn) => fn(state)); },
    subscribe(fn) { subs.add(fn); return () => subs.delete(fn); },
  };
}

/** Глобальное состояние: user — снимок Firebase-пользователя, profile — документ users/{uid}. */
export const appStore = createStore({ user: null, profile: null, ready: false });
