const express = require('express')
const router = express.Router()
const { getRaceControlMessages } = require('../controllers/raceControlController')
const { cacheMiddleware } = require('../middleware/cache')

router.get('/', cacheMiddleware(), getRaceControlMessages)

module.exports = router
