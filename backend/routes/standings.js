const express = require('express')
const router = express.Router()
const { getStandings } = require('../controllers/standingsController')
const { cacheMiddleware } = require('../middleware/cache')

router.get('/', cacheMiddleware(), getStandings)

module.exports = router
