const FlightService = require('../services/FlightService');

class FlightController {
  constructor(service = FlightService) {
    this.#service = service;
  }

  #service;

  #handleError(res, error, statusCode = 500) {
    res.status(statusCode).json({ success: false, message: error.message });
  }

  getFlights = async (req, res) => {
    try {
      const { source, destination, date } = req.query;
      const flights = await this.#service.getAllFlights({ source, destination, date });
      res.json({ success: true, count: flights.length, data: flights });
    } catch (error) {
      this.#handleError(res, error);
    }
  };

  getFlight = async (req, res) => {
    try {
      const flight = await this.#service.getFlightById(req.params.id);
      res.json({ success: true, data: flight });
    } catch (error) {
      this.#handleError(res, error, 404);
    }
  };

  createFlight = async (req, res) => {
    try {
      const flight = await this.#service.createFlight(req.body);
      res.status(201).json({ success: true, message: 'Flight created', data: flight });
    } catch (error) {
      this.#handleError(res, error, 400);
    }
  };

  updateFlight = async (req, res) => {
    try {
      const flight = await this.#service.updateFlight(req.params.id, req.body);
      res.json({ success: true, message: 'Flight updated', data: flight });
    } catch (error) {
      this.#handleError(res, error, 400);
    }
  };

  deleteFlight = async (req, res) => {
    try {
      const result = await this.#service.deleteFlight(req.params.id);
      res.json({ success: true, ...result });
    } catch (error) {
      this.#handleError(res, error, 404);
    }
  };
}

module.exports = new FlightController();
