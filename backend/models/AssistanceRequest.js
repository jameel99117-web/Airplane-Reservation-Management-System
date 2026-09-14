const mongoose = require('mongoose');

const assistanceRequestSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
    assistanceType: {
      type: String,
      enum: ['wheelchair', 'medical', 'elderly', 'special'],
      required: true
    },
    notes: { type: String, trim: true, default: '' },
    status: {
      type: String,
      enum: ['requested', 'approved', 'completed', 'denied'],
      default: 'requested'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('AssistanceRequest', assistanceRequestSchema);
