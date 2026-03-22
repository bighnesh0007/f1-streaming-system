/**
 * Telemetry Controller (v2) — includes multi-driver compare.
 */
const db = require('../db')
const logger = require('../logger')

async function getTelemetryByDriver(req, res, next) {
  try {
    const driverNumber = parseInt(req.params.driver_number)
    if (isNaN(driverNumber)) {
      return res.status(400).json({
        success: false, error: { message: 'Invalid driver number', statusCode: 400 },
      })
    }
    const limit = Math.min(500, Math.max(1, parseInt(req.query.limit) || 100))
    const sessionId = req.query.session_id ? parseInt(req.query.session_id) : null

    let query = `SELECT t.*, s.session_key, s.circuit_name
                 FROM telemetry t
                 LEFT JOIN sessions s ON t.session_id = s.id
                 WHERE t.driver_number = ?`
    const params = [driverNumber]

    if (sessionId) {
      query += ' AND t.session_id = ?'
      params.push(sessionId)
    }
    query += ' ORDER BY t.recorded_at DESC LIMIT ?'
    params.push(limit)

    const [rows] = await db.query(query, params)
    res.json({
      success: true, data: rows,
      meta: { driver_number: driverNumber, count: rows.length, limit },
    })
  } catch (err) {
    next(err)
  }
}

async function getLatestTelemetry(req, res, next) {
  try {
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20))
    const [rows] = await db.query(
      `SELECT t.*, d.full_name, d.name_acronym
       FROM telemetry t
       JOIN drivers d ON t.driver_number = d.driver_number
       ORDER BY t.created_at DESC LIMIT ?`,
      [limit]
    )
    res.json({ success: true, data: rows })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/telemetry/compare?drivers=1,4,16&limit=50
 * Multi-driver telemetry overlay.
 */
async function getMultiDriverTelemetry(req, res, next) {
  try {
    const driversParam = req.query.drivers
    if (!driversParam) {
      return res.status(400).json({ success: false, error: { message: 'drivers query param required (comma-separated)' } })
    }
    const driverNumbers = driversParam.split(',').map(Number).filter(n => !isNaN(n)).slice(0, 4)
    if (driverNumbers.length === 0) {
      return res.status(400).json({ success: false, error: { message: 'No valid driver numbers' } })
    }

    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit) || 50))
    const placeholders = driverNumbers.map(() => '?').join(',')

    const [rows] = await db.query(
      `SELECT t.driver_number, t.speed, t.throttle, t.brake, t.rpm, t.gear, t.drs,
              t.recorded_at, d.full_name, d.name_acronym
       FROM telemetry t
       JOIN drivers d ON t.driver_number = d.driver_number
       WHERE t.driver_number IN (${placeholders})
       ORDER BY t.recorded_at DESC
       LIMIT ?`,
      [...driverNumbers, limit * driverNumbers.length]
    )

    // Group by driver
    const grouped = {}
    for (const row of rows) {
      const dn = row.driver_number
      if (!grouped[dn]) grouped[dn] = { driver: { number: dn, name: row.full_name, acronym: row.name_acronym }, telemetry: [] }
      grouped[dn].telemetry.push(row)
    }

    res.json({ success: true, data: Object.values(grouped) })
  } catch (err) {
    next(err)
  }
}

module.exports = { getTelemetryByDriver, getLatestTelemetry, getMultiDriverTelemetry }
