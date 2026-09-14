const TicketService = require('../services/TicketService');

class TicketController {
  constructor(service = TicketService) {
    this.#service = service;
  }

  #service;

  issueTicket = async (req, res) => {
    try {
      const ticket = await this.#service.issueTicket(req.body.bookingId, req.user._id);
      res.status(201).json({ success: true, message: 'Ticket issued', data: ticket });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  };

  getTicketById = async (req, res) => {
    try {
      const ticket = await this.#service.getTicketById(req.params.id);
      res.json({ success: true, data: ticket });
    } catch (error) {
      res.status(404).json({ success: false, message: error.message });
    }
  };

  getTicketsByBooking = async (req, res) => {
    try {
      const tickets = await this.#service.getTicketsByBooking(req.params.bookingId);
      res.json({ success: true, count: tickets.length, data: tickets });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  getTicketsByPassenger = async (req, res) => {
    try {
      const tickets = await this.#service.getTicketsByPassenger(req.params.passengerId);
      res.json({ success: true, count: tickets.length, data: tickets });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  getAllTickets = async (req, res) => {
    try {
      const tickets = await this.#service.getAllTickets();
      res.json({ success: true, count: tickets.length, data: tickets });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  cancelTicket = async (req, res) => {
    try {
      const ticket = await this.#service.cancelTicket(req.params.id);
      res.json({ success: true, message: 'Ticket cancelled', data: ticket });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  };
}

module.exports = new TicketController();
