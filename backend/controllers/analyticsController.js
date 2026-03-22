/**
 * Analytics Controller — business logic for analytics endpoints.
 */
const db = require('../db')
const logger = require('../logger')

/**
 * GET /api/analytics — List all analytics with pagination.
 */
async function getAllAnalytics(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20))
    const offset = (page - 1) * limit

    const [rows] = await db.query(
      `SELECT a.*, d.full_name, d.name_acronym, t.name AS team_name,
              s.session_key, s.circuit_name
       FROM analytics a
       JOIN drivers d ON a.driver_number = d.driver_number
       LEFT JOIN teams t ON d.team_id = t.id
       LEFT JOIN sessions s ON a.session_id = s.id
       ORDER BY a.created_at DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    )

    const [[{ total }]] = await db.query('SELECT COUNT(*) AS total FROM analytics')

    logger.info(`Fetched ${rows.length} analytics records (page ${page})`)

    res.json({
      success: true,
      data: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/analytics/:driver_number — Get analytics for specific driver.
 */
async function getAnalyticsByDriver(req, res, next) {
  try {
    const driverNumber = parseInt(req.params.driver_number)
    if (isNaN(driverNumber)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid driver number', statusCode: 400 },
      })
    }

    const [rows] = await db.query(
      `SELECT a.*, d.full_name, d.name_acronym, t.name AS team_name,
              s.session_key, s.circuit_name
       FROM analytics a
       JOIN drivers d ON a.driver_number = d.driver_number
       LEFT JOIN teams t ON d.team_id = t.id
       LEFT JOIN sessions s ON a.session_id = s.id
       WHERE a.driver_number = ?
       ORDER BY a.created_at DESC`,
      [driverNumber]
    )

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: `No analytics found for driver #${driverNumber}`, statusCode: 404 },
      })
    }

    res.json({ success: true, data: rows })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/analytics/session/:session_id — Get analytics for a session.
 */
async function getAnalyticsBySession(req, res, next) {
  try {
    const sessionId = parseInt(req.params.session_id)
    if (isNaN(sessionId)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid session ID', statusCode: 400 },
      })
    }

    const [rows] = await db.query(
      `SELECT a.*, d.full_name, d.name_acronym, t.name AS team_name
       FROM analytics a
       JOIN drivers d ON a.driver_number = d.driver_number
       LEFT JOIN teams t ON d.team_id = t.id
       WHERE a.session_id = ?
       ORDER BY a.prediction_score DESC`,
      [sessionId]
    )

    res.json({ success: true, data: rows })
  } catch (err) {
    next(err)
  }
}

module.exports = { getAllAnalytics, getAnalyticsByDriver, getAnalyticsBySession }
