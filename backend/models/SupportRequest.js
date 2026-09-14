const mongoose = require('mongoose');

const supportRequestSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', default: null },
    subject: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'resolved', 'closed'],
      default: 'pending'
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium'
    },
    category: {
      type: String,
      enum: ['booking', 'payment', 'refund', 'general', 'technical'],
      default: 'general'
    },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    response: { type: String, trim: true, default: '' },
    resolvedAt: { type: Date, default: null },
    closedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model('SupportRequest', supportRequestSchema);
