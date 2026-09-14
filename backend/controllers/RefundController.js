const RefundService = require('../services/RefundService');
const { ROLES } = require('../config/roles');

class RefundController {
  constructor(service = RefundService) {
    this.#service = service;
  }

  #service;

  createRefundRequest = async (req, res) => {
    try {
      const { bookingId, reason } = req.body;
      if (!bookingId || !reason) {
        return res.status(400).json({
          success: false,
          message: 'bookingId and reason are required'
        });
      }

      const refund = await this.#service.createRefundRequest({
        bookingId,
        userId: req.user._id,
        reason
      });

      res.status(201).json({
        success: true,
        message: 'Refund request submitted',
        data: refund
      });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  };

  getMyRefunds = async (req, res) => {
    try {
      const refunds = await this.#service.getUserRefunds(req.user._id);
      res.json({ success: true, count: refunds.length, data: refunds });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  getAllRefunds = async (req, res) => {
    try {
      const refunds = await this.#service.getAllRefunds();
      res.json({ success: true, count: refunds.length, data: refunds });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  updateRefundStatus = async (req, res) => {
    try {
      const { status, notes } = req.body;
      if (!status || !['approved', 'rejected'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Valid status (approved/rejected) is required'
        });
      }

      const refund = await this.#service.updateRefundStatus(
        req.params.id,
        status,
        req.user._id,
        notes
      );

      res.json({
        success: true,
        message: `Refund ${status}`,
        data: refund
      });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  };
}

module.exports = new RefundController();
