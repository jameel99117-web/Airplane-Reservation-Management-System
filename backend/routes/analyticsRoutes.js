const express = require('express');
const AnalyticsController = require('../controllers/AnalyticsController');
const authMiddleware = require('../middleware/authMiddleware');
const { ROLES } = require('../config/roles');

const router = express.Router();

router.use(authMiddleware.authenticate.bind(authMiddleware));
router.use(authMiddleware.requireRoles(ROLES.ADMIN, ROLES.MANAGER, ROLES.AGENT).bind(authMiddleware));

router.get('/routes', AnalyticsController.getRoutePerformance);
router.get('/flights-ranking', AnalyticsController.getFlightPerformanceRanking);
router.get('/payments-refunds', AnalyticsController.getPaymentsAndRefunds);
router.get('/peak-times', AnalyticsController.getPeakBookingTimes);

module.exports = router;
