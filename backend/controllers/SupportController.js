const SupportService = require('../services/SupportService');

class SupportController {
  constructor(service = SupportService) {
    this.#service = service;
  }

  #service;

  createSupportRequest = async (req, res) => {
    try {
      const support = await this.#service.createSupportRequest({
        ...req.body,
        user: req.user._id
      });
      res.status(201).json({ success: true, message: 'Support request created', data: support });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  };

  getAllSupportRequests = async (req, res) => {
    try {
      const requests = await this.#service.getAllSupportRequests();
      res.json({ success: true, count: requests.length, data: requests });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  getSupportRequestById = async (req, res) => {
    try {
      const support = await this.#service.getSupportRequestById(req.params.id);
      res.json({ success: true, data: support });
    } catch (error) {
      res.status(404).json({ success: false, message: error.message });
    }
  };

  updateSupportRequest = async (req, res) => {
    try {
      const support = await this.#service.updateSupportRequest(req.params.id, req.body);
      res.json({ success: true, message: 'Support request updated', data: support });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  };
}

module.exports = new SupportController();
