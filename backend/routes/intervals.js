const express = require('express')
const router = express.Router()
const { getLatestIntervals } = require('../controllers/intervalsController')
const { cacheMiddleware } = require('../middleware/cache')

router.get('/', cacheMiddleware(), getLatestIntervals)

module.exports = router
