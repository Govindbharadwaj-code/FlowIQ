const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { getDashboardStats, getTaskTrends, getAgentPerformance } = require('../controllers/analyticsController');

router.get('/dashboard', authenticate, getDashboardStats);
router.get('/trends', authenticate, getTaskTrends);
router.get('/agent-performance', authenticate, authorize('manager', 'admin'), getAgentPerformance);

module.exports = router;
