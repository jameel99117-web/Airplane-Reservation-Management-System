const MealPreferenceModel = require('../models/MealPreference');
const BookingModel = require('../models/Booking');

class MealPreferenceService {
  async createMealPreference({ userId, bookingId, mealType, specialNotes }) {
    const validTypes = ['standard', 'vegetarian', 'special'];
    if (!validTypes.includes(mealType)) {
      throw new Error('Invalid meal type');
    }

    const booking = await BookingModel.findById(bookingId);
    if (!booking) throw new Error('Booking not found');

    if (booking.user.toString() !== userId.toString()) {
      throw new Error('You can only set meal preference for your own bookings');
    }

    const existingPreference = await MealPreferenceModel.findOne({ booking: bookingId });
    if (existingPreference) {
      existingPreference.mealType = mealType;
      existingPreference.specialNotes = specialNotes || '';
      await existingPreference.save();
      return this.#populate(existingPreference._id);
    }

    const preference = await MealPreferenceModel.create({
      user: userId,
      booking: bookingId,
      mealType,
      specialNotes: specialNotes || ''
    });

    return this.#populate(preference._id);
  }

  async getUserMealPreferences(userId) {
    return MealPreferenceModel.find({ user: userId })
      .populate('booking')
      .sort({ createdAt: -1 });
  }

  async getMealPreferenceByBooking(bookingId) {
    const preference = await MealPreferenceModel.findOne({ booking: bookingId })
      .populate('booking')
      .populate('user', 'name email');
    return preference;
  }

  async #populate(id) {
    return MealPreferenceModel.findById(id)
      .populate('booking')
      .populate('user', 'name email');
  }
}

module.exports = new MealPreferenceService();
