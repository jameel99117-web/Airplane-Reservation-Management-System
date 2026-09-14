const express = require('express');
const PaymentController = require('../controllers/PaymentController');
const authMiddleware = require('../middleware/authMiddleware');
const { ROLES } = require('../config/roles');

const router = express.Router();

router.use(authMiddleware.authenticate.bind(authMiddleware));
router.use(authMiddleware.requireRoles(ROLES.PASSENGER, ROLES.AGENT, ROLES.ADMIN).bind(authMiddleware));

router.post('/process', PaymentController.processPayment);
router.get('/status/:bookingId', PaymentController.getStatus);

module.exports = router;
