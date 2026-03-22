const db = require('../db')

async function getRaceControlMessages(req, res, next) {
  try {
    const sessionId = req.query.session_id ? parseInt(req.query.session_id) : null
    const limit = req.query.limit ? parseInt(req.query.limit) : 50
    
    let query = `SELECT * FROM race_control`
    const params = []
    
    if (sessionId) {
      query += ' WHERE session_id = ?'
      params.push(sessionId)
    }
    query += ' ORDER BY recorded_at DESC LIMIT ?'
    params.push(limit)

    const [rows] = await db.query(query, params)
    res.json({ success: true, data: rows })
  } catch (err) {
    next(err)
  }
}

module.exports = { getRaceControlMessages }
