/**
 * Analytics Routes
 */
const express = require('express')
const router = express.Router()
const {
  getAllAnalytics,
  getAnalyticsByDriver,
  getAnalyticsBySession,
} = require('../controllers/analyticsController')
const { cacheMiddleware } = require('../middleware/cache')

// GET /api/analytics — list all (cached, paginated)
router.get('/', cacheMiddleware(), getAllAnalytics)

// GET /api/analytics/session/:session_id — by session (must come before /:driver_number)
router.get('/session/:session_id', cacheMiddleware(), getAnalyticsBySession)

// GET /api/analytics/:driver_number — by driver
router.get('/:driver_number', cacheMiddleware(), getAnalyticsByDriver)

module.exports = router
