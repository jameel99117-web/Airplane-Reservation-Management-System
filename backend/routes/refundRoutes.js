const express = require('express');
const RefundController = require('../controllers/RefundController');
const authMiddleware = require('../middleware/authMiddleware');
const { ROLES } = require('../config/roles');

const router = express.Router();

router.use(authMiddleware.authenticate.bind(authMiddleware));

router.post(
  '/',
  authMiddleware.requireRoles(ROLES.PASSENGER, ROLES.AGENT, ROLES.ADMIN).bind(authMiddleware),
  RefundController.createRefundRequest
);

router.get('/my', RefundController.getMyRefunds);

router.get(
  '/all',
  authMiddleware.requireRoles(ROLES.ADMIN, ROLES.AGENT).bind(authMiddleware),
  RefundController.getAllRefunds
);

router.patch(
  '/:id',
  authMiddleware.requireRoles(ROLES.ADMIN, ROLES.AGENT).bind(authMiddleware),
  RefundController.updateRefundStatus
);

module.exports = router;
