/**
 * cacheService.js
 * In-memory LRU cache for AI-generated responses.
 *
 * Why: Identical requests (same location + voter type, same constituency,
 * same myth claim) hit the Anthropic API every time — wasting latency and
 * quota. This layer caches responses with per-type TTLs.
 *
 * Limits:
 *   - max 500 entries total (evicts LRU when full)
 *   - journey/insights: 2-hour TTL (election rules rarely change)
 *   - mythbuster: 4-hour TTL (facts are stable)
 *   - No persistence — cache is wiped on server restart (intentional for freshness)
 */

const { LRUCache } = require('lru-cache');

const HOUR = 1000 * 60 * 60;

// Single shared cache; TTL is set per-entry using the { ttl } option on .set()
const cache = new LRUCache({
  max: 500,
  // Default TTL: 2 hours; can be overridden per entry
  ttl: 2 * HOUR,
  // Automatically purge stale entries on access
  allowStale: false,
  updateAgeOnGet: false,
});

/**
 * Build a normalized cache key. All values are lowercased and trimmed
 * so "Delhi" and "delhi" hit the same cache slot.
 */
function buildKey(namespace, ...parts) {
  return [namespace, ...parts.map((p) => String(p).toLowerCase().trim())].join(':');
}

function get(key) {
  return cache.get(key) ?? null;
}

function set(key, value, ttlMs) {
  const opts = ttlMs ? { ttl: ttlMs } : {};
  cache.set(key, value, opts);
}

function invalidate(key) {
  cache.delete(key);
}

function stats() {
  return {
    size: cache.size,
    maxSize: cache.max,
    calculatedSize: cache.calculatedSize,
  };
}

module.exports = { buildKey, get, set, invalidate, stats, HOUR };
