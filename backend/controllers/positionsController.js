/**
 * Positions Controller — leaderboard data
 */
const db = require('../db')

async function getLatestPositions(req, res, next) {
  try {
    const sessionId = req.query.session_id ? parseInt(req.query.session_id) : null

    // Get the latest position for each driver (subquery for max recorded_at)
    let query = `
      SELECT p.driver_number, p.position, p.recorded_at,
             d.full_name, d.name_acronym, t.name AS team_name,
             d.headshot_url,
             best.lap_duration AS best_lap,
             last_lap.lap_duration AS last_lap,
             i.gap_to_leader, i.interval_to_ahead
      FROM positions p
      JOIN (
        SELECT driver_number, MAX(id) AS max_id
        FROM positions
        ${sessionId ? 'WHERE session_id = ?' : ''}
        GROUP BY driver_number
      ) latest ON p.driver_number = latest.driver_number AND p.id = latest.max_id
      JOIN drivers d ON p.driver_number = d.driver_number
      LEFT JOIN teams t ON d.team_id = t.id
      LEFT JOIN (
        SELECT driver_number, MIN(lap_duration) AS lap_duration
        FROM laps WHERE lap_duration > 0
        GROUP BY driver_number
      ) best ON p.driver_number = best.driver_number
      LEFT JOIN (
        SELECT driver_number, lap_duration
        FROM laps l1
        WHERE l1.id = (SELECT MAX(id) FROM laps l2 WHERE l2.driver_number = l1.driver_number)
      ) last_lap ON p.driver_number = last_lap.driver_number
      LEFT JOIN (
        SELECT driver_number, gap_to_leader, interval_to_ahead
        FROM intervals i1
        WHERE i1.id = (SELECT MAX(id) FROM intervals i2 WHERE i2.driver_number = i1.driver_number)
      ) i ON p.driver_number = i.driver_number
      ORDER BY p.position ASC
    `
    const params = sessionId ? [sessionId] : []

    const [rows] = await db.query(query, params)

    // Format gap string
    const data = rows.map((row, i) => {
      let gapText = 'LEADER'
      if (i > 0) {
        if (row.gap_to_leader) {
          gapText = `+${row.gap_to_leader.toFixed(3)}s`
        } else if (row.best_lap && rows[0].best_lap) {
          gapText = `+${(row.best_lap - rows[0].best_lap).toFixed(3)}s`
        } else {
          gapText = 'LAP'
        }
      }
      return { ...row, gap: gapText }
    })

    res.json({ success: true, data })
  } catch (err) {
    next(err)
  }
}

module.exports = { getLatestPositions }
