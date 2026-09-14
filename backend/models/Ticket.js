const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema(
  {
    ticketNumber: { type: String, required: true, unique: true, trim: true },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
    passenger: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    flight: { type: mongoose.Schema.Types.ObjectId, ref: 'Flight', required: true },
    seatNumbers: [{ type: String, required: true }],
    passengerName: { type: String, required: true, trim: true },
    passengerEmail: { type: String, required: true, trim: true },
    basePrice: { type: Number, required: true, min: 0 },
    discountApplied: { type: Number, default: 0 },
    discountType: { type: String, enum: ['percentage', 'fixed'], default: null },
    finalPrice: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['issued', 'cancelled', 'refunded'],
      default: 'issued'
    },
    issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    issuedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Ticket', ticketSchema);
