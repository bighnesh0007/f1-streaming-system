/**
 * Drivers Controller — business logic for driver endpoints.
 */
const db = require('../db')
const logger = require('../logger')

/**
 * GET /api/drivers — List all drivers with pagination.
 */
async function getAllDrivers(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20))
    const offset = (page - 1) * limit

    const [rows] = await db.query(
      `SELECT d.driver_number, d.full_name, d.name_acronym, 
              t.name AS team_name, d.country_code, d.headshot_url, d.updated_at
       FROM drivers d
       LEFT JOIN teams t ON d.team_id = t.id
       ORDER BY d.driver_number
       LIMIT ? OFFSET ?`,
      [limit, offset]
    )

    const [[{ total }]] = await db.query('SELECT COUNT(*) AS total FROM drivers')

    logger.info(`Fetched ${rows.length} drivers (page ${page})`)

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
 * GET /api/drivers/:id — Get single driver by driver_number.
 */
async function getDriverById(req, res, next) {
  try {
    const driverNumber = parseInt(req.params.id)
    if (isNaN(driverNumber)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid driver number', statusCode: 400 },
      })
    }

    const [rows] = await db.query(
      `SELECT d.driver_number, d.full_name, d.name_acronym,
              t.name AS team_name, d.country_code, d.headshot_url, d.updated_at
       FROM drivers d
       LEFT JOIN teams t ON d.team_id = t.id
       WHERE d.driver_number = ?`,
      [driverNumber]
    )

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: `Driver #${driverNumber} not found`, statusCode: 404 },
      })
    }

    res.json({ success: true, data: rows[0] })
  } catch (err) {
    next(err)
  }
}

module.exports = { getAllDrivers, getDriverById }
