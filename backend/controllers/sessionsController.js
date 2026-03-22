/**
 * Sessions Controller
 */
const db = require('../db')
const logger = require('../logger')

async function getAllSessions(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20))
    const offset = (page - 1) * limit
    const year = req.query.year ? parseInt(req.query.year) : null

    let query = `SELECT * FROM sessions`
    const params = []

    if (year) {
      query += ` WHERE year = ?`
      params.push(year)
    }

    query += ` ORDER BY started_at DESC LIMIT ? OFFSET ?`
    params.push(limit, offset)

    const [rows] = await db.query(query, params)

    let countQuery = 'SELECT COUNT(*) AS total FROM sessions'
    const countParams = []
    if (year) {
      countQuery += ' WHERE year = ?'
      countParams.push(year)
    }
    const [[{ total }]] = await db.query(countQuery, countParams)

    res.json({
      success: true,
      data: rows,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (err) {
    next(err)
  }
}

async function getSessionById(req, res, next) {
  try {
    const id = parseInt(req.params.id)
    if (isNaN(id)) {
      return res.status(400).json({ success: false, error: { message: 'Invalid session ID' } })
    }
    const [rows] = await db.query('SELECT * FROM sessions WHERE id = ?', [id])
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: { message: 'Session not found' } })
    }
    res.json({ success: true, data: rows[0] })
  } catch (err) {
    next(err)
  }
}

module.exports = { getAllSessions, getSessionById }
