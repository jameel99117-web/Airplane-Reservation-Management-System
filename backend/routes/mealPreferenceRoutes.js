const express = require('express');
const MealPreferenceController = require('../controllers/MealPreferenceController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware.authenticate.bind(authMiddleware));

router.post('/', MealPreferenceController.createMealPreference);
router.get('/my', MealPreferenceController.getUserMealPreferences);
router.get('/booking/:bookingId', MealPreferenceController.getMealPreferenceByBooking);

module.exports = router;
