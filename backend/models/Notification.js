const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['booking_confirmation', 'booking_cancellation', 'refund_pending', 'refund_approved', 'refund_rejected', 'refund_completed', 'payment_successful', 'payment_failed'],
      required: true
    },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    status: { type: String, trim: true, default: '' },
    isRead: { type: Boolean, default: false },
    relatedId: { type: mongoose.Schema.Types.ObjectId, default: null },
    relatedType: { type: String, enum: ['booking', 'refund', 'payment'], default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);
