const MealPreferenceService = require('../services/MealPreferenceService');

class MealPreferenceController {
  constructor(service = MealPreferenceService) {
    this.#service = service;
  }

  #service;

  createMealPreference = async (req, res) => {
    try {
      const { bookingId, mealType, specialNotes } = req.body;
      if (!bookingId || !mealType) {
        return res.status(400).json({ success: false, message: 'bookingId and mealType are required' });
      }

      const preference = await this.#service.createMealPreference({
        userId: req.user._id,
        bookingId,
        mealType,
        specialNotes: specialNotes || ''
      });

      res.status(201).json({ success: true, message: 'Meal preference saved', data: preference });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  };

  getUserMealPreferences = async (req, res) => {
    try {
      const preferences = await this.#service.getUserMealPreferences(req.user._id);
      res.json({ success: true, count: preferences.length, data: preferences });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  getMealPreferenceByBooking = async (req, res) => {
    try {
      const preference = await this.#service.getMealPreferenceByBooking(req.params.bookingId);
      if (!preference) {
        return res.json({ success: true, data: null });
      }
      res.json({ success: true, data: preference });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
}

module.exports = new MealPreferenceController();
