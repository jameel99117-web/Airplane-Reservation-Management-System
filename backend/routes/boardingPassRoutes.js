const express = require('express');
const BoardingPassController = require('../controllers/BoardingPassController');
const authMiddleware = require('../middleware/authMiddleware');
const { ROLES } = require('../config/roles');

const router = express.Router();

router.use(authMiddleware.authenticate.bind(authMiddleware));

router.get('/booking/:bookingId', BoardingPassController.generateBoardingPass);
router.get('/my', BoardingPassController.getUserBoardingPasses);

module.exports = router;
