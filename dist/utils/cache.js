"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.flushCache = exports.invalidateCache = exports.setInCache = exports.getFromCache = void 0;
const node_cache_1 = __importDefault(require("node-cache"));
// Initialize cache with a standard TTL (e.g., 1 hour) and check period
// Adjust TTL based on how often categories are expected to change
const cache = new node_cache_1.default({ stdTTL: 3600, checkperiod: 600 });
/**
 * Gets a value from the cache.
 * @param key The cache key.
 * @returns The cached value or undefined if not found or expired.
 */
const getFromCache = (key) => {
    return cache.get(key);
};
exports.getFromCache = getFromCache;
/**
 * Sets a value in the cache.
 * @param key The cache key.
 * @param value The value to cache.
 * @param ttl Optional TTL in seconds. Uses standard TTL if not provided.
 * @returns True if the value was set successfully.
 */
const setInCache = (key, value, ttl) => {
    if (ttl) {
        return cache.set(key, value, ttl);
    }
    return cache.set(key, value);
};
exports.setInCache = setInCache;
/**
 * Deletes a key from the cache.
 * @param key The cache key to delete.
 * @returns The number of keys deleted (0 or 1).
 */
const invalidateCache = (key) => {
    return cache.del(key);
};
exports.invalidateCache = invalidateCache;
/**
 * Flushes the entire cache.
 */
const flushCache = () => {
    cache.flushAll();
};
exports.flushCache = flushCache;
exports.default = cache;
