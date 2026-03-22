const express = require('express')
const router = express.Router()
const { getWeatherBySession, getLatestWeather } = require('../controllers/weatherController')
const { cacheMiddleware } = require('../middleware/cache')

router.get('/latest', cacheMiddleware(10), getLatestWeather)
router.get('/:session_id', cacheMiddleware(30), getWeatherBySession)

module.exports = router
