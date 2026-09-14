const HealthService = require('../services/HealthService');

class HealthController {
  constructor(service = HealthService) {
    this.#service = service;
  }

  #service;

  getHealth = async (req, res) => {
    try {
      const data = await this.#service.getStatus();
      res.json({ success: true, ...data });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
}

module.exports = new HealthController();
