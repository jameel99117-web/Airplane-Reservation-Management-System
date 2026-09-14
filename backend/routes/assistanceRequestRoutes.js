const express = require('express');
const AssistanceRequestController = require('../controllers/AssistanceRequestController');
const authMiddleware = require('../middleware/authMiddleware');
const { ROLES } = require('../config/roles');

const router = express.Router();

router.use(authMiddleware.authenticate.bind(authMiddleware));

router.post('/', AssistanceRequestController.createAssistanceRequest);
router.get('/my', AssistanceRequestController.getUserAssistanceRequests);
router.patch('/:id/status', authMiddleware.requireRoles(ROLES.AGENT, ROLES.ADMIN).bind(authMiddleware), AssistanceRequestController.updateAssistanceStatus);

module.exports = router;
