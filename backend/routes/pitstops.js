const express = require('express')
const router = express.Router()
const { getPitStopsByDriver } = require('../controllers/pitstopsController')
const { cacheMiddleware } = require('../middleware/cache')

router.get('/:driver_number', cacheMiddleware(), getPitStopsByDriver)

module.exports = router
