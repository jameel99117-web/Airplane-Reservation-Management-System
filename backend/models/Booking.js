const mongoose = require('mongoose');

const passengerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true }
  },
  { _id: false }
);

const bookingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    flight: { type: mongoose.Schema.Types.ObjectId, ref: 'Flight', required: true },
    seatNumbers: [{ type: String, required: true }],
    passengers: [passengerSchema],
    passengerName: { type: String, trim: true },
    passengerEmail: { type: String, trim: true },
    totalAmount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['pending_payment', 'confirmed', 'cancelled', 'refunded'],
      default: 'pending_payment'
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'success', 'failed'],
      default: 'pending'
    },
    paymentTransactionId: { type: String, default: null },
    paymentMethod: { type: String, default: null },
    specialRequest: { type: String, trim: true, default: '' },
    bookedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    bookingReference: { type: String, unique: true, required: true },
    cancelledAt: { type: Date, default: null },
    paidAmount: { type: Number, default: 0, min: 0 },
    rescheduledFrom: { type: mongoose.Schema.Types.ObjectId, ref: 'Flight', default: null },
    rescheduledAt: { type: Date, default: null },
    rescheduleCount: { type: Number, default: 0, min: 0 },
    originalAmount: { type: Number, default: null },
    promoCode: { type: String, trim: true, uppercase: true, default: null },
    promoCodeId: { type: mongoose.Schema.Types.ObjectId, ref: 'PromoCode', default: null },
    discountApplied: { type: Number, default: 0 },
    discountType: { type: String, enum: ['percentage', 'fixed'], default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Booking', bookingSchema);
