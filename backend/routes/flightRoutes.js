const express = require('express');
const FlightController = require('../controllers/FlightController');
const authMiddleware = require('../middleware/authMiddleware');
const { ROLES } = require('../config/roles');

const router = express.Router();

router.get('/public', FlightController.getFlights);
router.get('/public/:id', FlightController.getFlight);

router.use(authMiddleware.authenticate.bind(authMiddleware));

router.get('/', FlightController.getFlights);
router.get('/:id', FlightController.getFlight);

router.post('/', authMiddleware.requireRoles(ROLES.ADMIN).bind(authMiddleware), FlightController.createFlight);
router.put('/:id', authMiddleware.requireRoles(ROLES.ADMIN).bind(authMiddleware), FlightController.updateFlight);
router.delete('/:id', authMiddleware.requireRoles(ROLES.ADMIN).bind(authMiddleware), FlightController.deleteFlight);

module.exports = router;
