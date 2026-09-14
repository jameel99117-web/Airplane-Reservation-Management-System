const mongoose = require('mongoose');

const baggageItemSchema = new mongoose.Schema(
  {
    weight: { type: Number, required: true, min: 0 },
    type: {
      type: String,
      enum: ['carry_on', 'checked', 'special'],
      required: true
    },
    description: { type: String, trim: true },
    isExcess: { type: Boolean, default: false },
    feeApplied: { type: Number, default: 0 }
  },
  { _id: false }
);

const baggageManagementSchema = new mongoose.Schema(
  {
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    flight: { type: mongoose.Schema.Types.ObjectId, ref: 'Flight', required: true },
    tier: {
      type: String,
      enum: ['silver', 'gold', 'platinum'],
      default: 'silver'
    },
    baggageItems: [baggageItemSchema],
    totalWeight: { type: Number, default: 0, min: 0 },
    allowedWeight: { type: Number, required: true },
    excessWeight: { type: Number, default: 0, min: 0 },
    totalFee: { type: Number, default: 0, min: 0 },
    feeStatus: {
      type: String,
      enum: ['pending', 'paid', 'waived'],
      default: 'pending'
    },
    specialItems: [{
      type: { type: String },
      description: { type: String },
      approved: { type: Boolean, default: false },
      feeWaived: { type: Boolean, default: false }
    }],
    restrictions: [{
      type: String,
      description: String,
      isViolated: { type: Boolean, default: false }
    }]
  },
  { timestamps: true }
);

baggageManagementSchema.index({ booking: 1, unique: true });
baggageManagementSchema.index({ user: 1 });
baggageManagementSchema.index({ flight: 1 });

module.exports = mongoose.model('BaggageManagement', baggageManagementSchema);
