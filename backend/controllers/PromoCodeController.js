const PromoCodeService = require('../services/PromoCodeService');

class PromoCodeController {
  constructor(service = PromoCodeService) {
    this.#service = service;
  }

  #service;

  createPromoCode = async (req, res) => {
    try {
      const promo = await this.#service.createPromoCode(req.body, req.user._id);
      res.status(201).json({ success: true, message: 'Promo code created', data: promo });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  };

  getAllPromoCodes = async (req, res) => {
    try {
      const promos = await this.#service.getAllPromoCodes();
      res.json({ success: true, count: promos.length, data: promos });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  getPromoCodeById = async (req, res) => {
    try {
      const promo = await this.#service.getPromoCodeById(req.params.id);
      res.json({ success: true, data: promo });
    } catch (error) {
      res.status(404).json({ success: false, message: error.message });
    }
  };

  updatePromoCode = async (req, res) => {
    try {
      const promo = await this.#service.updatePromoCode(req.params.id, req.body);
      res.json({ success: true, message: 'Promo code updated', data: promo });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  };

  deletePromoCode = async (req, res) => {
    try {
      const result = await this.#service.deletePromoCode(req.params.id);
      res.json({ success: true, ...result });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  };

  validatePromoCode = async (req, res) => {
    try {
      const { code, amount } = req.body;
      if (!code || amount === undefined) {
        return res.status(400).json({
          success: false,
          message: 'code and amount are required'
        });
      }
      const result = await this.#service.validatePromoCode(code, Number(amount));
      if (!result.valid) {
        return res.status(400).json({ success: false, message: result.message });
      }
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  };

  getPromoCodeUsage = async (req, res) => {
    try {
      const usage = await this.#service.getPromoCodeUsage(req.params.id);
      res.json({ success: true, data: usage });
    } catch (error) {
      res.status(404).json({ success: false, message: error.message });
    }
  };
}

module.exports = new PromoCodeController();
