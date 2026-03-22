/**
 * Laps Controller
 */
const db = require('../db')
const logger = require('../logger')

async function getLapsByDriver(req, res, next) {
  try {
    const driverNumber = parseInt(req.params.driver_number)
    if (isNaN(driverNumber)) {
      return res.status(400).json({ success: false, error: { message: 'Invalid driver number' } })
    }
    const sessionId = req.query.session_id ? parseInt(req.query.session_id) : null
    
    let query = `SELECT l.*, s.session_key, s.circuit_name
                 FROM laps l
                 LEFT JOIN sessions s ON l.session_id = s.id
                 WHERE l.driver_number = ?`
    const params = [driverNumber]
    
    if (sessionId) {
      query += ' AND l.session_id = ?'
      params.push(sessionId)
    }
    query += ' ORDER BY l.lap_number ASC'

    const [rows] = await db.query(query, params)
    res.json({ success: true, data: rows, meta: { driver_number: driverNumber, count: rows.length } })
  } catch (err) {
    next(err)
  }
}

async function getBestLap(req, res, next) {
  try {
    const driverNumber = parseInt(req.params.driver_number)
    if (isNaN(driverNumber)) {
      return res.status(400).json({ success: false, error: { message: 'Invalid driver number' } })
    }
    const [rows] = await db.query(
      `SELECT l.*, s.circuit_name
       FROM laps l LEFT JOIN sessions s ON l.session_id = s.id
       WHERE l.driver_number = ? AND l.lap_duration IS NOT NULL AND l.lap_duration > 0
       ORDER BY l.lap_duration ASC LIMIT 1`,
      [driverNumber]
    )
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: { message: 'No laps found' } })
    }
    res.json({ success: true, data: rows[0] })
  } catch (err) {
    next(err)
  }
}

module.exports = { getLapsByDriver, getBestLap }
