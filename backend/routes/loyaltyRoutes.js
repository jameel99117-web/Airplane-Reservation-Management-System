const express = require('express');
const router = express.Router();
const LoyaltyProgramController = require('../controllers/LoyaltyProgramController');
const { authenticate } = require('../middleware/authMiddleware');

router.get('/my', authenticate, LoyaltyProgramController.getMyLoyaltyProgram);
router.get('/my/benefits', authenticate, LoyaltyProgramController.getTierBenefits);
router.get('/my/history', authenticate, LoyaltyProgramController.getRewardsHistory);
router.post('/my/redeem', authenticate, LoyaltyProgramController.redeemPoints);
router.get('/redemption-value/:points', authenticate, LoyaltyProgramController.getRedemptionValue);
router.post('/my/add-points', authenticate, LoyaltyProgramController.addPoints);
router.get('/', authenticate, LoyaltyProgramController.getAllLoyaltyPrograms);
router.get('/:id', authenticate, LoyaltyProgramController.getLoyaltyProgram);

module.exports = router;
