/**
 * F1 Streaming Backend — Express Server (v2)
 * ========================================
 * REST API + SSE + WebSocket with all new route sets.
 */
const express = require('express')
const cors = require('cors')
const http = require('http')
const config = require('./config')
const logger = require('./logger')
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler')
const db = require('./db')

// Routes
const driversRoutes = require('./routes/drivers')
const analyticsRoutes = require('./routes/analytics')
const telemetryRoutes = require('./routes/telemetry')
const healthRoutes = require('./routes/health')
const sessionsRoutes = require('./routes/sessions')
const lapsRoutes = require('./routes/laps')
const positionsRoutes = require('./routes/positions')
const weatherRoutes = require('./routes/weather')
const scheduleRoutes = require('./routes/schedule')
const locationsRoutes = require('./routes/locations')
const pitstopsRoutes = require('./routes/pitstops')
const intervalsRoutes = require('./routes/intervals')
const racecontrolRoutes = require('./routes/racecontrol')
const standingsRoutes = require('./routes/standings')

const app = express()
const server = http.createServer(app)

// ==========================================
// Middleware
// ==========================================
app.use(cors())
app.use(express.json())

app.use((req, res, next) => {
  const start = Date.now()
  res.on('finish', () => {
    const duration = Date.now() - start
    logger.info(`${req.method} ${req.originalUrl}`, {
      statusCode: res.statusCode, duration: `${duration}ms`, ip: req.ip,
    })
  })
  next()
})

// ==========================================
// API Routes
// ==========================================
app.get('/', (req, res) => {
  res.json({
    name: 'F1 Streaming System API',
    version: '3.0.0',
    endpoints: {
      health: '/api/health',
      drivers: '/api/drivers',
      analytics: '/api/analytics',
      telemetry: '/api/telemetry',
      sessions: '/api/sessions',
      laps: '/api/laps',
      positions: '/api/positions',
      weather: '/api/weather',
      schedule: '/api/schedule',
      locations: '/api/locations',
      pitstops: '/api/pitstops',
      intervals: '/api/intervals',
      racecontrol: '/api/racecontrol',
      standings: '/api/standings',
      sse: '/api/stream/telemetry',
    },
  })
})

app.use('/api/health', healthRoutes)
app.use('/api/drivers', driversRoutes)
app.use('/api/analytics', analyticsRoutes)
app.use('/api/telemetry', telemetryRoutes)
app.use('/api/sessions', sessionsRoutes)
app.use('/api/laps', lapsRoutes)
app.use('/api/positions', positionsRoutes)
app.use('/api/weather', weatherRoutes)
app.use('/api/schedule', scheduleRoutes)
app.use('/api/locations', locationsRoutes)
app.use('/api/pitstops', pitstopsRoutes)
app.use('/api/intervals', intervalsRoutes)
app.use('/api/racecontrol', racecontrolRoutes)
app.use('/api/standings', standingsRoutes)

// ==========================================
// SSE — Server-Sent Events for real-time push
// ==========================================
const sseClients = new Set()

app.get('/api/stream/telemetry', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  })

  const driverFilter = req.query.driver ? parseInt(req.query.driver) : null
  const client = { res, driverFilter }
  sseClients.add(client)

  res.write(`data: ${JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() })}\n\n`)

  req.on('close', () => {
    sseClients.delete(client)
    logger.info(`SSE client disconnected (total: ${sseClients.size})`)
  })

  logger.info(`SSE client connected (total: ${sseClients.size})${driverFilter ? ` filtering driver #${driverFilter}` : ''}`)
})

// SSE broadcast helper
function broadcastSSE(data) {
  const payload = `data: ${JSON.stringify({ type: 'telemetry', data, timestamp: new Date().toISOString() })}\n\n`
  for (const client of sseClients) {
    if (client.driverFilter && data.driver_number && data.driver_number !== client.driverFilter) {
      continue
    }
    client.res.write(payload)
  }
}

// Poll DB for latest telemetry and push via SSE (every 2 seconds)
setInterval(async () => {
  if (sseClients.size === 0) return
  try {
    const [rows] = await db.query(
      `SELECT t.*, d.full_name, d.name_acronym
       FROM telemetry t JOIN drivers d ON t.driver_number = d.driver_number
       ORDER BY t.created_at DESC LIMIT 5`
    )
    for (const row of rows) {
      broadcastSSE(row)
    }
  } catch (err) {
    // Silently fail — SSE is best-effort
  }
}, 2000)

// ==========================================
// WebSocket
// ==========================================
let WebSocket
try {
  WebSocket = require('ws')
} catch (e) {
  logger.warn('ws package not installed. WebSocket support disabled.')
}

if (WebSocket) {
  const wss = new WebSocket.Server({ server, path: '/ws/telemetry' })
  let clientCount = 0

  wss.on('connection', (ws) => {
    clientCount++
    logger.info(`WebSocket client connected (total: ${clientCount})`)

    ws.on('close', () => {
      clientCount--
      logger.info(`WebSocket client disconnected (total: ${clientCount})`)
    })

    ws.on('error', (err) => {
      logger.error('WebSocket error', { error: err.message })
    })

    ws.send(JSON.stringify({
      type: 'connected',
      message: 'Connected to F1 telemetry stream',
      timestamp: new Date().toISOString(),
    }))
  })

  app.locals.broadcastTelemetry = (data) => {
    const payload = JSON.stringify({ type: 'telemetry', data, timestamp: new Date().toISOString() })
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload)
      }
    })
  }

  // Wire DB polling for WebSocket broadcast too
  setInterval(async () => {
    if (!wss.clients || wss.clients.size === 0) return
    try {
      const [rows] = await db.query(
        `SELECT t.*, d.full_name, d.name_acronym
         FROM telemetry t JOIN drivers d ON t.driver_number = d.driver_number
         ORDER BY t.created_at DESC LIMIT 3`
      )
      for (const row of rows) {
        app.locals.broadcastTelemetry(row)
      }
    } catch (err) {
      // Silently fail
    }
  }, 2000)

  logger.info('WebSocket server initialized at ws://localhost:' + config.server.port + '/ws/telemetry')
}

// ==========================================
// Error Handling
// ==========================================
app.use(notFoundHandler)
app.use(errorHandler)

// ==========================================
// Start Server
// ==========================================
server.listen(config.server.port, () => {
  logger.info('='.repeat(60))
  logger.info(`F1 Streaming API v3.0.0`)
  logger.info(`Server running on http://localhost:${config.server.port}`)
  logger.info(`SSE endpoint: http://localhost:${config.server.port}/api/stream/telemetry`)
  logger.info('='.repeat(60))
})

process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down...')
  server.close(() => { process.exit(0) })
})

process.on('SIGINT', () => {
  logger.info('SIGINT received. Shutting down...')
  server.close(() => { process.exit(0) })
})