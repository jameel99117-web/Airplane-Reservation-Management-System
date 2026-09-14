const express = require('express');
const router = express.Router();
const BaggageManagementController = require('../controllers/BaggageManagementController');
const { authenticate } = require('../middleware/authMiddleware');

router.get('/booking/:bookingId', authenticate, BaggageManagementController.getBaggageByBooking);
router.post('/booking/:bookingId/items', authenticate, BaggageManagementController.addBaggageItem);
router.delete('/booking/:bookingId/items', authenticate, BaggageManagementController.removeBaggageItem);
router.get('/booking/:bookingId/fee', authenticate, BaggageManagementController.calculateBaggageFee);
router.put('/booking/:bookingId/fee-status', authenticate, BaggageManagementController.updateFeeStatus);
router.get('/booking/:bookingId/restrictions', authenticate, BaggageManagementController.checkRestrictions);
router.get('/my', authenticate, BaggageManagementController.getUserBaggage);
router.get('/', authenticate, BaggageManagementController.getAllBaggageRecords);
router.get('/:id', authenticate, BaggageManagementController.getBaggageById);

module.exports = router;
