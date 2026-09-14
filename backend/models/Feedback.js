const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
    flight: { type: mongoose.Schema.Types.ObjectId, ref: 'Flight', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true, default: '' }
  },
  { timestamps: true }
);

feedbackSchema.index({ user: 1, booking: 1 }, { unique: true });

module.exports = mongoose.model('Feedback', feedbackSchema);
