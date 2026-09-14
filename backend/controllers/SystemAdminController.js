const SystemAdminService = require('../services/SystemAdminService');

class SystemAdminController {
  constructor(service = SystemAdminService) {
    this.#service = service;
  }

  #service;

  getUsers = async (req, res) => {
    try {
      const users = await this.#service.getAllUsers();
      res.json({ success: true, count: users.length, data: users });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  updateUserRole = async (req, res) => {
    try {
      const { role } = req.body;
      if (!role) return res.status(400).json({ success: false, message: 'role is required' });
      const user = await this.#service.updateUserRole(req.params.id, role);
      res.json({ success: true, message: 'Role updated', data: user });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  };

  deleteUser = async (req, res) => {
    try {
      const result = await this.#service.deleteUser(req.params.id, req.user._id);
      res.json({ success: true, ...result });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  };

  getSystemSettings = async (req, res) => {
    try {
      const settings = await this.#service.getSystemSettings();
      res.json({ success: true, data: settings });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  updateSystemSettings = async (req, res) => {
    try {
      const settings = await this.#service.updateSystemSettings(req.body);
      res.json({ success: true, message: 'Settings updated', data: settings });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  };
}

module.exports = new SystemAdminController();
