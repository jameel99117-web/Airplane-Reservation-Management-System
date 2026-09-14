const PricingRuleModel = require('../models/PricingRule');

class PricingRuleService {
  async createPricingRule(data) {
    const rule = await PricingRuleModel.create(data);
    return rule;
  }

  async getAllPricingRules() {
    return PricingRuleModel.find().sort({ priority: -1, createdAt: -1 });
  }

  async getPricingRuleById(id) {
    const rule = await PricingRuleModel.findById(id);
    if (!rule) throw new Error('Pricing rule not found');
    return rule;
  }

  async updatePricingRule(id, data) {
    const rule = await PricingRuleModel.findByIdAndUpdate(id, data, { new: true });
    if (!rule) throw new Error('Pricing rule not found');
    return rule;
  }

  async deletePricingRule(id) {
    const rule = await PricingRuleModel.findByIdAndDelete(id);
    if (!rule) throw new Error('Pricing rule not found');
    return { message: 'Pricing rule deleted' };
  }

  async applyPricingRules(basePrice, flightData) {
    const rules = await PricingRuleModel.find({ isActive: true }).sort({ priority: -1 });
    let adjustedPrice = basePrice;

    for (const rule of rules) {
      if (this.#matchesRule(rule, flightData)) {
        if (rule.valueType === 'percentage') {
          if (rule.ruleType === 'discount') {
            adjustedPrice = adjustedPrice * (1 - rule.value / 100);
          } else if (rule.ruleType === 'markup') {
            adjustedPrice = adjustedPrice * (1 + rule.value / 100);
          }
        } else if (rule.valueType === 'fixed') {
          if (rule.ruleType === 'discount') {
            adjustedPrice = adjustedPrice - rule.value;
          } else if (rule.ruleType === 'markup') {
            adjustedPrice = adjustedPrice + rule.value;
          }
        }
      }
    }

    return Math.max(0, adjustedPrice);
  }

  #matchesRule(rule, flightData) {
    const conditions = rule.conditions || {};

    if (conditions.source && flightData.source !== conditions.source) {
      return false;
    }

    if (conditions.destination && flightData.destination !== conditions.destination) {
      return false;
    }

    if (conditions.minPrice && flightData.price < conditions.minPrice) {
      return false;
    }

    if (conditions.maxPrice && flightData.price > conditions.maxPrice) {
      return false;
    }

    if (conditions.startDate || conditions.endDate) {
      const flightDate = new Date(flightData.departureDate);
      if (conditions.startDate && flightDate < new Date(conditions.startDate)) {
        return false;
      }
      if (conditions.endDate && flightDate > new Date(conditions.endDate)) {
        return false;
      }
    }

    if (conditions.daysOfWeek && conditions.daysOfWeek.length > 0) {
      const dayMap = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };
      const flightDay = new Date(flightData.departureDate).getDay();
      const dayName = Object.keys(dayMap).find(key => dayMap[key] === flightDay);
      if (!conditions.daysOfWeek.includes(dayName)) {
        return false;
      }
    }

    return true;
  }
}

module.exports = new PricingRuleService();
