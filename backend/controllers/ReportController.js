const ReportService = require('../services/ReportService');

class ReportController {
  constructor(service = ReportService) {
    this.#service = service;
  }

  #service;

  getOverview = async (req, res) => {
    try {
      const data = await this.#service.getOverview();
      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  getOccupancy = async (req, res) => {
    try {
      const data = await this.#service.getSeatOccupancy();
      res.json({ success: true, count: data.length, data });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  getPerformance = async (req, res) => {
    try {
      const data = await this.#service.getPerformanceReport();
      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
}

module.exports = new ReportController();
