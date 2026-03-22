const db = require('../db')
const logger = require('../logger')

async function getPitStopsByDriver(req, res, next) {
  try {
    const driverNumber = parseInt(req.params.driver_number)
    const sessionId = req.query.session_id ? parseInt(req.query.session_id) : null
    
    let query = `SELECT p.* FROM pit_stops p WHERE p.driver_number = ?`
    const params = [driverNumber]
    
    if (sessionId) {
      query += ' AND p.session_id = ?'
      params.push(sessionId)
    }
    query += ' ORDER BY p.stop_number ASC'

    const [rows] = await db.query(query, params)
    res.json({ success: true, data: rows })
  } catch (err) {
    next(err)
  }
}

module.exports = { getPitStopsByDriver }
