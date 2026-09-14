const express = require('express');
const HealthController = require('../controllers/HealthController');

const router = express.Router();

router.get('/', HealthController.getHealth);

module.exports = router;
