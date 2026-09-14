const express = require('express');
const ReportController = require('../controllers/ReportController');
const authMiddleware = require('../middleware/authMiddleware');
const { ROLES } = require('../config/roles');

const router = express.Router();

router.use(authMiddleware.authenticate.bind(authMiddleware));
router.use(authMiddleware.requireRoles(ROLES.MANAGER).bind(authMiddleware));

router.get('/overview', ReportController.getOverview);
router.get('/occupancy', ReportController.getOccupancy);
router.get('/performance', ReportController.getPerformance);

module.exports = router;
