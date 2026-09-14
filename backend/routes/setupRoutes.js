const express = require('express');
const SetupController = require('../controllers/SetupController');

const router = express.Router();

router.get('/status', SetupController.getStatus);
router.post('/seed-flights', SetupController.seedFlights);

module.exports = router;
