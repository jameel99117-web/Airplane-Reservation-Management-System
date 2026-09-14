const PricingRuleService = require('../services/PricingRuleService');

class PricingRuleController {
  constructor(service = PricingRuleService) {
    this.#service = service;
  }

  #service;

  createPricingRule = async (req, res) => {
    try {
      const rule = await this.#service.createPricingRule(req.body);
      res.status(201).json({ success: true, message: 'Pricing rule created', data: rule });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  };

  getAllPricingRules = async (req, res) => {
    try {
      const rules = await this.#service.getAllPricingRules();
      res.json({ success: true, count: rules.length, data: rules });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  getPricingRuleById = async (req, res) => {
    try {
      const rule = await this.#service.getPricingRuleById(req.params.id);
      res.json({ success: true, data: rule });
    } catch (error) {
      res.status(404).json({ success: false, message: error.message });
    }
  };

  updatePricingRule = async (req, res) => {
    try {
      const rule = await this.#service.updatePricingRule(req.params.id, req.body);
      res.json({ success: true, message: 'Pricing rule updated', data: rule });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  };

  deletePricingRule = async (req, res) => {
    try {
      const result = await this.#service.deletePricingRule(req.params.id);
      res.json({ success: true, ...result });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  };
}

module.exports = new PricingRuleController();
