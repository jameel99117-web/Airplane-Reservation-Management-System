const mongoose = require('mongoose');

const mealPreferenceSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
    mealType: {
      type: String,
      enum: ['standard', 'vegetarian', 'special'],
      required: true
    },
    specialNotes: { type: String, trim: true, default: '' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('MealPreference', mealPreferenceSchema);
