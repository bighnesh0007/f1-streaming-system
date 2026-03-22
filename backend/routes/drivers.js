/**
 * Driver Routes
 */
const express = require('express')
const router = express.Router()
const { getAllDrivers, getDriverById } = require('../controllers/driversController')
const { cacheMiddleware } = require('../middleware/cache')

// GET /api/drivers — list all drivers (cached, paginated)
router.get('/', cacheMiddleware(), getAllDrivers)

// GET /api/drivers/:id — single driver by number
router.get('/:id', cacheMiddleware(), getDriverById)

module.exports = router
