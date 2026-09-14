const mongoose = require('mongoose');

const pricingRuleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    ruleType: {
      type: String,
      enum: ['markup', 'discount', 'seasonal', 'route_specific'],
      required: true
    },
    value: { type: Number, required: true },
    valueType: {
      type: String,
      enum: ['percentage', 'fixed'],
      required: true
    },
    conditions: {
      source: { type: String, trim: true },
      destination: { type: String, trim: true },
      minPrice: { type: Number, min: 0 },
      maxPrice: { type: Number, min: 0 },
      startDate: { type: Date },
      endDate: { type: Date },
      daysOfWeek: [{ type: String, enum: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] }]
    },
    isActive: { type: Boolean, default: true },
    priority: { type: Number, default: 0 }
  },
  { timestamps: true }
);

module.exports = mongoose.model('PricingRule', pricingRuleSchema);
