const express = require('express')
const router = express.Router()
const { getAllSessions, getSessionById } = require('../controllers/sessionsController')
const { cacheMiddleware } = require('../middleware/cache')

router.get('/', cacheMiddleware(60), getAllSessions)
router.get('/:id', cacheMiddleware(60), getSessionById)

module.exports = router
