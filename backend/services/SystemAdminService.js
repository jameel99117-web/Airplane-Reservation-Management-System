const UserModel = require('../models/User');
const SystemSettingsModel = require('../models/SystemSettings');
const { ASSIGNABLE_ROLES, normalizeRole } = require('../config/roles');

class SystemAdminService {
  async getAllUsers() {
    const users = await UserModel.find().select('-password').sort({ createdAt: -1 });
    return users.map((u) => ({
      id: u._id,
      name: u.name,
      email: u.email,
      role: normalizeRole(u.role),
      createdAt: u.createdAt
    }));
  }

  async updateUserRole(userId, role) {
    if (!ASSIGNABLE_ROLES.includes(role)) {
      throw new Error(`Invalid role. Allowed: ${ASSIGNABLE_ROLES.join(', ')}`);
    }
    const user = await UserModel.findByIdAndUpdate(userId, { role }, { new: true }).select('-password');
    if (!user) throw new Error('User not found');
    return {
      id: user._id,
      name: user.name,
      email: user.email,
      role: normalizeRole(user.role)
    };
  }

  async deleteUser(userId, requesterId) {
    if (userId.toString() === requesterId.toString()) {
      throw new Error('Cannot delete your own account');
    }
    const user = await UserModel.findByIdAndDelete(userId);
    if (!user) throw new Error('User not found');
    return { message: 'User deleted' };
  }

  async getSystemSettings() {
    let settings = await SystemSettingsModel.findOne();
    if (!settings) {
      settings = await SystemSettingsModel.create({});
    }
    return settings;
  }

  async updateSystemSettings(updates) {
    const settings = await SystemSettingsModel.findOne();
    if (!settings) {
      return await SystemSettingsModel.create(updates);
    }
    Object.keys(updates).forEach((key) => {
      if (updates[key] !== undefined) {
        settings[key] = updates[key];
      }
    });
    await settings.save();
    return settings;
  }
}

module.exports = new SystemAdminService();
