/**
 * Weather Controller
 */
const db = require('../db')

async function getWeatherBySession(req, res, next) {
  try {
    const sessionId = parseInt(req.params.session_id)
    if (isNaN(sessionId)) {
      return res.status(400).json({ success: false, error: { message: 'Invalid session ID' } })
    }
    const [rows] = await db.query(
      'SELECT * FROM weather WHERE session_id = ? ORDER BY recorded_at DESC LIMIT 20',
      [sessionId]
    )
    res.json({ success: true, data: rows })
  } catch (err) {
    next(err)
  }
}

async function getLatestWeather(req, res, next) {
  try {
    const [rows] = await db.query(
      'SELECT * FROM weather ORDER BY created_at DESC LIMIT 1'
    )
    res.json({ success: true, data: rows[0] || null })
  } catch (err) {
    next(err)
  }
}

module.exports = { getWeatherBySession, getLatestWeather }
