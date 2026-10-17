/**
 * High-performance Bounded LRU Cache with TTL (Time-to-Live).
 * Automatically evicts least recently used items when maxSize is exceeded,
 * preventing memory leaks in persistent container environments.
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export interface BoundedLruCacheOptions {
  maxSize?: number;
  defaultTtlMs?: number;
}

export class BoundedLruCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private readonly maxSize: number;
  private readonly defaultTtlMs: number;

  constructor(options: BoundedLruCacheOptions = {}) {
    this.maxSize = Math.max(1, options.maxSize ?? 500);
    this.defaultTtlMs = Math.max(1000, options.defaultTtlMs ?? 5 * 60 * 1000); // 5 minutes default
  }

  /**
   * Retrieves an item from cache. Refreshes item position in LRU order.
   * If item has expired, it is evicted and undefined is returned.
   */
  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }

    // Refresh LRU order: re-insert key to mark as most recently used
    this.cache.delete(key);
    this.cache.set(key, entry);
    return entry.value;
  }

  /**
   * Inserts or updates an item in the cache.
   * Evicts the oldest item if maxSize would be exceeded.
   */
  set(key: string, value: T, ttlMs?: number): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Evict oldest (first inserted in Map iterator)
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
      }
    }

    const expiresAt = Date.now() + (ttlMs ?? this.defaultTtlMs);
    this.cache.set(key, { value, expiresAt });
  }

  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  size(): number {
    return this.cache.size;
  }

  clear(): void {
    this.cache.clear();
  }
}
