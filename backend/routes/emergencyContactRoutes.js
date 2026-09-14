const express = require('express');
const EmergencyContactController = require('../controllers/EmergencyContactController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware.authenticate.bind(authMiddleware));

router.post('/', EmergencyContactController.createEmergencyContact);
router.get('/', EmergencyContactController.getUserEmergencyContacts);
router.patch('/:id', EmergencyContactController.updateEmergencyContact);
router.delete('/:id', EmergencyContactController.deleteEmergencyContact);

module.exports = router;
