const mongoose = require('mongoose');

const loyaltyProgramSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    points: { type: Number, default: 0, min: 0 },
    tier: {
      type: String,
      enum: ['silver', 'gold', 'platinum'],
      default: 'silver'
    },
    totalFlights: { type: Number, default: 0, min: 0 },
    totalSpent: { type: Number, default: 0, min: 0 },
    pointsEarned: { type: Number, default: 0, min: 0 },
    pointsRedeemed: { type: Number, default: 0, min: 0 },
    tierUpgradeDate: { type: Date, default: null },
    lastActivityDate: { type: Date, default: Date.now },
    rewardsHistory: [{
      type: {
        type: String,
        enum: ['points_earned', 'points_redeemed', 'tier_upgrade']
      },
      points: { type: Number },
      description: { type: String },
      referenceId: { type: mongoose.Schema.Types.ObjectId },
      referenceType: { type: String },
      createdAt: { type: Date, default: Date.now }
    }]
  },
  { timestamps: true }
);

loyaltyProgramSchema.index({ tier: 1 });

module.exports = mongoose.model('LoyaltyProgram', loyaltyProgramSchema);
