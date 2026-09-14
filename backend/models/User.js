const mongoose = require('mongoose');
const { ROLES, ASSIGNABLE_ROLES } = require('../config/roles');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    role: {
      type: String,
      enum: [...ASSIGNABLE_ROLES, 'user'],
      default: ROLES.PASSENGER
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
