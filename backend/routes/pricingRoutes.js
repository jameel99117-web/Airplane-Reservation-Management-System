const express = require('express');
const PricingRuleController = require('../controllers/PricingRuleController');
const authMiddleware = require('../middleware/authMiddleware');
const { ROLES } = require('../config/roles');

const router = express.Router();

router.use(authMiddleware.authenticate.bind(authMiddleware));
router.use(authMiddleware.requireRoles(ROLES.ADMIN).bind(authMiddleware));

router.post('/', PricingRuleController.createPricingRule);
router.get('/', PricingRuleController.getAllPricingRules);
router.get('/:id', PricingRuleController.getPricingRuleById);
router.patch('/:id', PricingRuleController.updatePricingRule);
router.delete('/:id', PricingRuleController.deletePricingRule);

module.exports = router;
