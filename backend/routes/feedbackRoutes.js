const express = require('express');
const FeedbackController = require('../controllers/FeedbackController');
const authMiddleware = require('../middleware/authMiddleware');
const { ROLES } = require('../config/roles');

const router = express.Router();

router.use(authMiddleware.authenticate.bind(authMiddleware));

router.post('/', FeedbackController.createFeedback);
router.get('/my', FeedbackController.getUserFeedback);
router.get('/all', authMiddleware.requireRoles(ROLES.ADMIN, ROLES.AGENT).bind(authMiddleware), FeedbackController.getAllFeedback);
router.get('/:id', FeedbackController.getFeedbackById);

module.exports = router;
