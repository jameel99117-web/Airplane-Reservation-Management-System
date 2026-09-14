const mongoose = require('mongoose');

const systemSettingsSchema = new mongoose.Schema(
  {
    systemName: { type: String, default: 'SkyBook Airlines', trim: true },
    supportEmail: { type: String, default: 'support@skybook.com', trim: true },
    supportPhone: { type: String, default: '', trim: true },
    currency: { type: String, default: 'USD', trim: true },
    timezone: { type: String, default: 'UTC', trim: true },
    maxBookingDays: { type: Number, default: 365, min: 1 },
    cancellationHours: { type: Number, default: 24, min: 0 },
    refundPolicy: { type: String, default: 'Refunds processed within 5-7 business days', trim: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('SystemSettings', systemSettingsSchema);
