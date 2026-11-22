/**
 * Lightweight in-memory TTL cache for server-side route handlers and helpers.
 * Reduces redundant remote Turso HTTP round-trips for semi-static data
 * (plans, banks, BCV rate, discounts, payment methods, external API config)
 * while supporting immediate invalidation on mutations.
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const globalForCache = globalThis as typeof globalThis & {
  __linkbioServerCache?: Map<string, CacheEntry<any>>;
};

const store: Map<string, CacheEntry<any>> =
  globalForCache.__linkbioServerCache ?? new Map<string, CacheEntry<any>>();

if (!globalForCache.__linkbioServerCache) {
  globalForCache.__linkbioServerCache = store;
}

export function cacheGet<T>(key: string): T | null {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.value as T;
}

export function cacheSet<T>(key: string, value: T, ttlMs: number): T {
  store.set(key, {
    value,
    expiresAt: Date.now() + ttlMs,
  });
  return value;
}

export function cacheInvalidate(keyOrPrefix: string, isPrefix = false): void {
  if (!isPrefix) {
    store.delete(keyOrPrefix);
    return;
  }
  for (const key of store.keys()) {
    if (key.startsWith(keyOrPrefix)) {
      store.delete(key);
    }
  }
}

export async function cacheGetOrSet<T>(
  key: string,
  ttlMs: number,
  loader: () => Promise<T>
): Promise<T> {
  const existing = cacheGet<T>(key);
  if (existing !== null) {
    return existing;
  }
  const value = await loader();
  return cacheSet(key, value, ttlMs);
}
