const mongoose = require('mongoose');

const promoCodeSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true
    },
    description: { type: String, trim: true, default: '' },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed'],
      required: true
    },
    discountValue: { type: Number, required: true, min: 0 },
    expiresAt: { type: Date, required: true },
    usageLimit: { type: Number, required: true, min: 1 },
    usageCount: { type: Number, default: 0, min: 0 },
    minOrderAmount: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model('PromoCode', promoCodeSchema);
