/**
 * In-Memory TTL Cache Middleware — no Redis dependency.
 * Caches GET responses with configurable TTL.
 */
const config = require('../config')
const logger = require('../logger')

// In-memory cache store
const cacheStore = new Map()

/**
 * Cache entry structure: { data, expiry }
 */
function cacheMiddleware(ttlOverride = null) {
  const ttl = (ttlOverride || config.cache.ttlSeconds) * 1000 // Convert to ms

  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') return next()

    const key = req.originalUrl
    const cached = cacheStore.get(key)

    if (cached && cached.expiry > Date.now()) {
      logger.debug(`Cache HIT: ${key}`)
      return res.json(cached.data)
    }

    // Store original json method and intercept
    const originalJson = res.json.bind(res)
    res.json = (data) => {
      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cacheStore.set(key, {
          data,
          expiry: Date.now() + ttl,
        })
        logger.debug(`Cache SET: ${key} (TTL: ${ttl / 1000}s)`)
      }
      return originalJson(data)
    }

    next()
  }
}

/**
 * Clear all cache entries (useful after data changes).
 */
function clearCache() {
  const size = cacheStore.size
  cacheStore.clear()
  logger.info(`Cache cleared (${size} entries removed)`)
}

/**
 * Clean up expired entries periodically.
 */
setInterval(() => {
  const now = Date.now()
  let cleaned = 0
  for (const [key, value] of cacheStore) {
    if (value.expiry <= now) {
      cacheStore.delete(key)
      cleaned++
    }
  }
  if (cleaned > 0) {
    logger.debug(`Cache cleanup: removed ${cleaned} expired entries`)
  }
}, 60000) // Clean every minute

module.exports = { cacheMiddleware, clearCache }
