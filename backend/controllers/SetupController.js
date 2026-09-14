const SetupService = require('../services/SetupService');

class SetupController {
  constructor(service = SetupService) {
    this.#service = service;
  }

  #service;

  getStatus = async (req, res) => {
    try {
      const data = await this.#service.getStatus();
      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  seedFlights = async (req, res) => {
    try {
      const force = req.query.force === 'true';
      const data = await this.#service.seedFlights(force);
      res.json({ success: true, message: 'Flight data loaded', data });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
}

module.exports = new SetupController();
