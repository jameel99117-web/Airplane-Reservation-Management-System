const express = require('express');
const PromoCodeController = require('../controllers/PromoCodeController');
const authMiddleware = require('../middleware/authMiddleware');
const { ROLES } = require('../config/roles');

const router = express.Router();

router.use(authMiddleware.authenticate.bind(authMiddleware));

router.post(
  '/validate',
  authMiddleware.requireRoles(ROLES.PASSENGER, ROLES.AGENT, ROLES.ADMIN).bind(authMiddleware),
  PromoCodeController.validatePromoCode
);

router.use(authMiddleware.requireRoles(ROLES.ADMIN).bind(authMiddleware));

router.post('/', PromoCodeController.createPromoCode);
router.get('/', PromoCodeController.getAllPromoCodes);
router.get('/:id/usage', PromoCodeController.getPromoCodeUsage);
router.get('/:id', PromoCodeController.getPromoCodeById);
router.patch('/:id', PromoCodeController.updatePromoCode);
router.delete('/:id', PromoCodeController.deletePromoCode);

module.exports = router;
