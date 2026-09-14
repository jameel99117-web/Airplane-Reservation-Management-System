const UserModel = require('../models/User');
const User = require('../classes/User');
const { ROLES, normalizeRole } = require('../config/roles');

class UserService {
  async register({ name, email, password }) {
    const existing = await UserModel.findOne({ email: email.toLowerCase() });
    if (existing) {
      throw new Error('Email already registered');
    }
    const userEntity = new User({ name, email, password, role: ROLES.PASSENGER });
    const hashedPassword = await userEntity.hashPassword();
    const doc = await UserModel.create({
      name: userEntity.name,
      email: userEntity.email.toLowerCase(),
      password: hashedPassword,
      role: userEntity.role
    });
    const registered = User.fromDocument(doc);
    const safe = registered.toSafeObject();
    safe.role = normalizeRole(safe.role);
    const token = registered.generateToken();
    return { user: safe, token };
  }

  async login({ email, password }) {
    const doc = await UserModel.findOne({ email: email.toLowerCase() });
    if (!doc) {
      throw new Error('Invalid email or password');
    }
    const userEntity = User.fromDocument(doc);
    const valid = await userEntity.comparePassword(password);
    if (!valid) {
      throw new Error('Invalid email or password');
    }
    const safe = userEntity.toSafeObject();
    safe.role = normalizeRole(safe.role);
    const token = userEntity.generateToken();
    return { user: safe, token };
  }

  async getPassengers() {
    const docs = await UserModel.find({ role: { $in: [ROLES.PASSENGER, 'user'] } }).select('name email');
    return docs.map((d) => ({ id: d._id, name: d.name, email: d.email }));
  }

  async getProfile(userId) {
    const doc = await UserModel.findById(userId).select('-password');
    if (!doc) throw new Error('User not found');
    return User.fromDocument({ ...doc.toObject(), password: '' }).toSafeObject();
  }

  async updateProfile(userId, updates) {
    const doc = await UserModel.findById(userId);
    if (!doc) throw new Error('User not found');

    if (updates.name) doc.name = updates.name;
    if (updates.email) {
      const existing = await UserModel.findOne({ email: updates.email.toLowerCase(), _id: { $ne: userId } });
      if (existing) throw new Error('Email already in use');
      doc.email = updates.email.toLowerCase();
    }
    if (updates.password) {
      const userEntity = new User({ ...doc.toObject(), password: updates.password });
      doc.password = await userEntity.hashPassword();
    }

    await doc.save();
    return User.fromDocument({ ...doc.toObject(), password: '' }).toSafeObject();
  }
}

module.exports = new UserService();
