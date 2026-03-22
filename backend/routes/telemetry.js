/**
 * Telemetry Routes (v2) — includes multi-driver compare
 */
const express = require('express')
const router = express.Router()
const {
  getTelemetryByDriver, getLatestTelemetry, getMultiDriverTelemetry,
} = require('../controllers/telemetryController')
const { cacheMiddleware } = require('../middleware/cache')

router.get('/latest', cacheMiddleware(10), getLatestTelemetry)
router.get('/compare', cacheMiddleware(5), getMultiDriverTelemetry)
router.get('/:driver_number', cacheMiddleware(10), getTelemetryByDriver)

module.exports = router
