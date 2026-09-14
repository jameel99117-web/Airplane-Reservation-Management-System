const UserService = require('../services/UserService');
const { DASHBOARD_BY_ROLE, normalizeRole } = require('../config/roles');

class UserController {
  constructor(service = UserService) {
    this.#service = service;
  }

  #service;

  register = async (req, res) => {
    try {
      const { name, email, password } = req.body;
      if (!name || !email || !password) {
        return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
      }
      const result = await this.#service.register({ name, email, password });
      const role = normalizeRole(result.user.role);
      res.status(201).json({
        success: true,
        message: 'Registration successful',
        data: { ...result, dashboard: DASHBOARD_BY_ROLE[role] }
      });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  };

  login = async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email and password are required' });
      }
      const result = await this.#service.login({ email, password });
      const role = normalizeRole(result.user.role);
      res.json({
        success: true,
        message: 'Login successful',
        data: { ...result, dashboard: DASHBOARD_BY_ROLE[role] }
      });
    } catch (error) {
      res.status(401).json({ success: false, message: error.message });
    }
  };

  getProfile = async (req, res) => {
    try {
      const profile = await this.#service.getProfile(req.user._id);
      res.json({ success: true, data: profile });
    } catch (error) {
      res.status(404).json({ success: false, message: error.message });
    }
  };

  getPassengers = async (req, res) => {
    try {
      const passengers = await this.#service.getPassengers();
      res.json({ success: true, count: passengers.length, data: passengers });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  updateProfile = async (req, res) => {
    try {
      const { name, email, password } = req.body;
      const updates = {};
      if (name) updates.name = name;
      if (email) updates.email = email;
      if (password) updates.password = password;

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ success: false, message: 'No fields to update' });
      }

      const profile = await this.#service.updateProfile(req.user._id, updates);
      res.json({ success: true, message: 'Profile updated', data: profile });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  };
}

module.exports = new UserController();
