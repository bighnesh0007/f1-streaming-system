const db = require('../db')

async function getStandings(req, res, next) {
  try {
    const year = req.query.year ? parseInt(req.query.year) : 2024
    
    const [drivers] = await db.query(
      `SELECT s.*, d.full_name, d.name_acronym, t.name as team_name
       FROM standings s
       JOIN drivers d ON s.entity_id = d.driver_number
       LEFT JOIN teams t ON d.team_id = t.id
       WHERE s.entity_type = 'driver' AND s.year = ?
       ORDER BY s.position ASC`,
      [year]
    )

    const [teams] = await db.query(
      `SELECT s.*, t.name as team_name
       FROM standings s
       JOIN teams t ON s.entity_id = t.id
       WHERE s.entity_type = 'team' AND s.year = ?
       ORDER BY s.position ASC`,
      [year]
    )

    res.json({ success: true, data: { drivers, teams } })
  } catch (err) {
    next(err)
  }
}

module.exports = { getStandings }
