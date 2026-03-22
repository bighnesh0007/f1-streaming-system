const db = require('../db')

async function getLatestIntervals(req, res, next) {
  try {
    const sessionId = req.query.session_id ? parseInt(req.query.session_id) : null
    
    let query = `
      SELECT i.*, d.full_name, d.name_acronym
      FROM intervals i
      JOIN drivers d ON i.driver_number = d.driver_number
      WHERE i.id IN (
        SELECT MAX(id) FROM intervals GROUP BY driver_number
      )
    `
    const params = []
    if (sessionId) {
      query += ' AND i.session_id = ?'
      params.push(sessionId)
    }

    const [rows] = await db.query(query, params)
    res.json({ success: true, data: rows })
  } catch (err) {
    next(err)
  }
}

module.exports = { getLatestIntervals }
