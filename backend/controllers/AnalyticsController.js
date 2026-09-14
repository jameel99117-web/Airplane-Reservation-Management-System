const AnalyticsService = require('../services/AnalyticsService');

class AnalyticsController {
  constructor(service = AnalyticsService) {
    this.#service = service;
  }

  #service;

  getRoutePerformance = async (req, res) => {
    try {
      const sortOrder = req.query.sort || 'desc';
      const data = await this.#service.getRoutePerformance(sortOrder);
      res.json({ success: true, count: data.length, data });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  getFlightPerformanceRanking = async (req, res) => {
    try {
      const data = await this.#service.getFlightPerformanceRanking();
      res.json({ success: true, count: data.length, data });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  getPaymentsAndRefunds = async (req, res) => {
    try {
      const filters = {
        status: req.query.status
      };
      const data = await this.#service.getPaymentsAndRefunds(filters);
      res.json({ success: true, count: data.length, data });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  getPeakBookingTimes = async (req, res) => {
    try {
      const data = await this.#service.getPeakBookingTimes();
      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
}

module.exports = new AnalyticsController();
