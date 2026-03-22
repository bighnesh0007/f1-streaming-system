const express = require('express')
const router = express.Router()
const { getLatestPositions } = require('../controllers/positionsController')
const { cacheMiddleware } = require('../middleware/cache')

router.get('/latest', cacheMiddleware(5), getLatestPositions)

module.exports = router
