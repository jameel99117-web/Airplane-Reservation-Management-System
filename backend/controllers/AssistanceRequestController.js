const AssistanceRequestService = require('../services/AssistanceRequestService');

class AssistanceRequestController {
  constructor(service = AssistanceRequestService) {
    this.#service = service;
  }

  #service;

  createAssistanceRequest = async (req, res) => {
    try {
      const { bookingId, assistanceType, notes } = req.body;
      if (!bookingId || !assistanceType) {
        return res.status(400).json({ success: false, message: 'bookingId and assistanceType are required' });
      }

      const request = await this.#service.createAssistanceRequest({
        userId: req.user._id,
        bookingId,
        assistanceType,
        notes: notes || ''
      });

      res.status(201).json({ success: true, message: 'Assistance request submitted', data: request });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  };

  getUserAssistanceRequests = async (req, res) => {
    try {
      const requests = await this.#service.getUserAssistanceRequests(req.user._id);
      res.json({ success: true, count: requests.length, data: requests });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  updateAssistanceStatus = async (req, res) => {
    try {
      const { status } = req.body;
      if (!status) {
        return res.status(400).json({ success: false, message: 'status is required' });
      }

      const request = await this.#service.updateAssistanceStatus(req.params.id, status, req.user);
      res.json({ success: true, message: 'Assistance status updated', data: request });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  };
}

module.exports = new AssistanceRequestController();
