const EmergencyContactService = require('../services/EmergencyContactService');

class EmergencyContactController {
  constructor(service = EmergencyContactService) {
    this.#service = service;
  }

  #service;

  createEmergencyContact = async (req, res) => {
    try {
      const { name, relationship, phone } = req.body;
      if (!name || !relationship || !phone) {
        return res.status(400).json({ success: false, message: 'Name, relationship, and phone are required' });
      }

      const contact = await this.#service.createEmergencyContact({
        userId: req.user._id,
        name,
        relationship,
        phone
      });

      res.status(201).json({ success: true, message: 'Emergency contact added', data: contact });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  };

  getUserEmergencyContacts = async (req, res) => {
    try {
      const contacts = await this.#service.getUserEmergencyContacts(req.user._id);
      res.json({ success: true, count: contacts.length, data: contacts });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  updateEmergencyContact = async (req, res) => {
    try {
      const contact = await this.#service.updateEmergencyContact(req.params.id, req.body, req.user._id);
      res.json({ success: true, message: 'Emergency contact updated', data: contact });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  };

  deleteEmergencyContact = async (req, res) => {
    try {
      const result = await this.#service.deleteEmergencyContact(req.params.id, req.user._id);
      res.json({ success: true, ...result });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  };
}

module.exports = new EmergencyContactController();
