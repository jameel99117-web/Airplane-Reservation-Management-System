const BaggageManagementService = require('../services/BaggageManagementService');

class BaggageManagementController {
  constructor(service = BaggageManagementService) {
    this.#service = service;
  }

  #service;

  #handleError(res, error, statusCode = 400) {
    res.status(statusCode).json({ success: false, message: error.message });
  }

  getBaggageByBooking = async (req, res) => {
    try {
      const baggage = await this.#service.getBaggageByBooking(req.params.bookingId);
      res.json({ success: true, data: baggage });
    } catch (error) {
      this.#handleError(res, error, 404);
    }
  };

  addBaggageItem = async (req, res) => {
    try {
      const { weight, type, description } = req.body;
      
      if (!weight || weight <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Weight must be a positive number'
        });
      }

      if (!type || !['carry_on', 'checked', 'special'].includes(type)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid baggage type'
        });
      }

      const baggage = await this.#service.addBaggageItem(
        req.params.bookingId,
        { weight, type, description: description || '' }
      );
      res.json({
        success: true,
        message: 'Baggage item added successfully',
        data: baggage
      });
    } catch (error) {
      this.#handleError(res, error);
    }
  };

  removeBaggageItem = async (req, res) => {
    try {
      const { bookingId } = req.params;
      const { itemIndex } = req.body;
      
      if (itemIndex === undefined || itemIndex < 0) {
        return res.status(400).json({
          success: false,
          message: 'Valid item index is required'
        });
      }

      const baggage = await this.#service.removeBaggageItem(bookingId, itemIndex);
      res.json({
        success: true,
        message: 'Baggage item removed successfully',
        data: baggage
      });
    } catch (error) {
      this.#handleError(res, error);
    }
  };

  calculateBaggageFee = async (req, res) => {
    try {
      const feeDetails = await this.#service.calculateBaggageFee(req.params.bookingId);
      res.json({ success: true, data: feeDetails });
    } catch (error) {
      this.#handleError(res, error, 404);
    }
  };

  updateFeeStatus = async (req, res) => {
    try {
      const { status } = req.body;
      
      if (!status || !['pending', 'paid', 'waived'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid fee status'
        });
      }

      const baggage = await this.#service.updateBaggageFeeStatus(req.params.bookingId, status);
      res.json({
        success: true,
        message: 'Fee status updated successfully',
        data: baggage
      });
    } catch (error) {
      this.#handleError(res, error);
    }
  };

  checkRestrictions = async (req, res) => {
    try {
      const restrictions = await this.#service.checkBaggageRestrictions(req.params.bookingId);
      res.json({ success: true, data: restrictions });
    } catch (error) {
      this.#handleError(res, error, 404);
    }
  };

  getUserBaggage = async (req, res) => {
    try {
      const baggage = await this.#service.getUserBaggage(req.user._id);
      res.json({ success: true, count: baggage.length, data: baggage });
    } catch (error) {
      this.#handleError(res, error, 500);
    }
  };

  getAllBaggageRecords = async (req, res) => {
    try {
      const records = await this.#service.getAllBaggageRecords();
      res.json({ success: true, count: records.length, data: records });
    } catch (error) {
      this.#handleError(res, error, 500);
    }
  };

  getBaggageById = async (req, res) => {
    try {
      const baggage = await this.#service.getBaggageById(req.params.id);
      res.json({ success: true, data: baggage });
    } catch (error) {
      this.#handleError(res, error, 404);
    }
  };
}

module.exports = new BaggageManagementController();
