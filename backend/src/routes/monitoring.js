const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { getUsageStats, getActivityLog } = require('../controllers/monitoringController');

// Get platform usage statistics (platform admin only)
router.get('/usage-stats', authenticateToken, getUsageStats);

// Get recent activity log (platform admin only)
router.get('/activity-log', authenticateToken, getActivityLog);

module.exports = router;
