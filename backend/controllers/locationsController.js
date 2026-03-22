const db = require('../db');

/**
 * Get latest locations for all drivers in a session
 */
exports.getLatestLocations = async (req, res, next) => {
  try {
    const { session_id } = req.query;
    
    // Get the most recent location for each driver in this session
    let query = `
      SELECT l.driver_number, l.x, l.y, l.z, l.date,
             d.full_name, d.name_acronym
      FROM locations l
      JOIN (
        SELECT driver_number, MAX(id) as max_id
        FROM locations
        ${session_id ? 'WHERE session_id = ?' : ''}
        GROUP BY driver_number
      ) latest ON l.id = latest.max_id
      JOIN drivers d ON l.driver_number = d.driver_number
    `;
    
    const params = session_id ? [session_id] : [];
    const [rows] = await db.query(query, params);
    
    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    next(error);
  }
};
