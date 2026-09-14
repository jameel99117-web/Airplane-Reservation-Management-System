const PaymentService = require('../services/PaymentService');

class PaymentController {
  constructor(service = PaymentService) {
    this.#service = service;
  }

  #service;

  processPayment = async (req, res) => {
    try {
      const { bookingId, method, cardLastFour } = req.body;
      if (!bookingId) {
        return res.status(400).json({ success: false, message: 'bookingId is required' });
      }
      const result = await this.#service.processPayment({ bookingId, method, cardLastFour });
      res.json({
        success: result.status === 'success',
        message: result.message,
        data: result
      });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  };

  getStatus = async (req, res) => {
    try {
      const status = await this.#service.getPaymentStatus(req.params.bookingId);
      res.json({ success: true, data: status });
    } catch (error) {
      res.status(404).json({ success: false, message: error.message });
    }
  };
}

module.exports = new PaymentController();
