/**
 * Health Check Route
 */
const express = require('express')
const router = express.Router()
const db = require('../db')
const logger = require('../logger')

// GET /api/health — system health check
router.get('/', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'f1-backend',
    uptime: process.uptime(),
    checks: {},
  }

  // Check MySQL connectivity
  try {
    const [rows] = await db.query('SELECT 1 AS alive')
    health.checks.mysql = { status: 'connected', latency: 'ok' }
  } catch (err) {
    health.status = 'degraded'
    health.checks.mysql = { status: 'disconnected', error: err.message }
    logger.error('Health check: MySQL down', { error: err.message })
  }

  const statusCode = health.status === 'ok' ? 200 : 503
  res.status(statusCode).json(health)
})

module.exports = router
