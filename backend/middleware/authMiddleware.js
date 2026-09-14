const jwt = require('jsonwebtoken');
const UserModel = require('../models/User');
const { normalizeRole } = require('../config/roles');

class AuthMiddleware {
  async authenticate(req, res, next) {
    try {
      const header = req.headers.authorization;
      if (!header || !header.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
      }
      const token = header.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await UserModel.findById(decoded.id).select('-password');
      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid token. User not found.' });
      }
      req.user = user;
      req.userRole = normalizeRole(user.role);
      next();
    } catch (error) {
      return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
    }
  }

  requireRoles(...allowedRoles) {
    return (req, res, next) => {
      const role = req.userRole || normalizeRole(req.user?.role);
      const normalized = allowedRoles.map((r) => (r === 'user' ? 'passenger' : r));
      if (!normalized.includes(role)) {
        return res.status(403).json({
          success: false,
          message: `Access denied. Required role: ${allowedRoles.join(' or ')}`
        });
      }
      next();
    };
  }

  requireAdmin(req, res, next) {
    return this.requireRoles('admin')(req, res, next);
  }

  requireAgent(req, res, next) {
    return this.requireRoles('agent', 'admin')(req, res, next);
  }

  requireManager(req, res, next) {
    return this.requireRoles('manager', 'admin')(req, res, next);
  }
}

module.exports = new AuthMiddleware();
