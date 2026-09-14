const express = require('express');
const SupportController = require('../controllers/SupportController');
const authMiddleware = require('../middleware/authMiddleware');
const { ROLES } = require('../config/roles');

const router = express.Router();

router.use(authMiddleware.authenticate.bind(authMiddleware));

router.post('/', SupportController.createSupportRequest);
router.get('/', SupportController.getAllSupportRequests);
router.get('/:id', SupportController.getSupportRequestById);
router.patch('/:id', SupportController.updateSupportRequest);

module.exports = router;
