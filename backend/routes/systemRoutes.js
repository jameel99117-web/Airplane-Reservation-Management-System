const express = require('express');
const SystemAdminController = require('../controllers/SystemAdminController');
const authMiddleware = require('../middleware/authMiddleware');
const { ROLES } = require('../config/roles');

const router = express.Router();

router.use(authMiddleware.authenticate.bind(authMiddleware));
router.use(authMiddleware.requireRoles(ROLES.ADMIN).bind(authMiddleware));

router.get('/users', SystemAdminController.getUsers);
router.patch('/users/:id/role', SystemAdminController.updateUserRole);
router.delete('/users/:id', SystemAdminController.deleteUser);

router.get('/settings', SystemAdminController.getSystemSettings);
router.patch('/settings', SystemAdminController.updateSystemSettings);

module.exports = router;
