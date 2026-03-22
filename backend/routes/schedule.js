const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');

router.get('/', scheduleController.getSchedule);
router.get('/:meetingKey/sessions', scheduleController.getMeetingSessions);

module.exports = router;
