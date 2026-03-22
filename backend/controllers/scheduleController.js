const db = require('../db');

/**
 * Get full season schedule
 */
exports.getSchedule = async (req, res) => {
  try {
    const { year } = req.query;
    let query = 'SELECT * FROM meetings';
    const params = [];

    if (year) {
      query += ' WHERE year = ?';
      params.push(year);
    }

    query += ' ORDER BY date_start ASC';

    const [rows] = await db.execute(query, params);
    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('Error fetching schedule:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * Get sessions for a specific meeting
 */
exports.getMeetingSessions = async (req, res) => {
  try {
    const { meetingKey } = req.params;
    const [rows] = await db.execute(
      'SELECT * FROM sessions WHERE meeting_key = ? ORDER BY date_start ASC',
      [meetingKey]
    );
    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('Error fetching meeting sessions:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
