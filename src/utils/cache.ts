import NodeCache from "node-cache";

// Initialize cache with a standard TTL (e.g., 1 hour) and check period
// Adjust TTL based on how often categories are expected to change
const cache = new NodeCache({ stdTTL: 3600, checkperiod: 600 });

/**
 * Gets a value from the cache.
 * @param key The cache key.
 * @returns The cached value or undefined if not found or expired.
 */
export const getFromCache = <T>(key: string): T | undefined => {
  return cache.get<T>(key);
};

/**
 * Sets a value in the cache.
 * @param key The cache key.
 * @param value The value to cache.
 * @param ttl Optional TTL in seconds. Uses standard TTL if not provided.
 * @returns True if the value was set successfully.
 */
export const setInCache = <T>(key: string, value: T, ttl?: number): boolean => {
  if (ttl) {
    return cache.set(key, value, ttl);
  }
  return cache.set(key, value);
};

/**
 * Deletes a key from the cache.
 * @param key The cache key to delete.
 * @returns The number of keys deleted (0 or 1).
 */
export const invalidateCache = (key: string): number => {
  return cache.del(key);
};

/**
 * Flushes the entire cache.
 */
export const flushCache = (): void => {
  cache.flushAll();
};

export default cache;

