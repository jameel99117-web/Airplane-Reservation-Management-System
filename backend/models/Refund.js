const mongoose = require('mongoose');

const refundSchema = new mongoose.Schema(
  {
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true, min: 0 },
    reason: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    processedAt: { type: Date, default: null },
    notes: { type: String, trim: true, default: '' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Refund', refundSchema);
