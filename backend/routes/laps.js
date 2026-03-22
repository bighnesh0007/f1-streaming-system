const express = require('express')
const router = express.Router()
const { getLapsByDriver, getBestLap } = require('../controllers/lapsController')
const { cacheMiddleware } = require('../middleware/cache')

router.get('/:driver_number/best', cacheMiddleware(), getBestLap)
router.get('/:driver_number', cacheMiddleware(), getLapsByDriver)

module.exports = router
