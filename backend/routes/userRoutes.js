const express = require('express');
const UserController = require('../controllers/UserController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', UserController.register);
router.post('/login', UserController.login);
router.get('/profile', authMiddleware.authenticate.bind(authMiddleware), UserController.getProfile);
router.patch('/profile', authMiddleware.authenticate.bind(authMiddleware), UserController.updateProfile);
router.get(
  '/passengers',
  authMiddleware.authenticate.bind(authMiddleware),
  authMiddleware.requireAgent.bind(authMiddleware),
  UserController.getPassengers
);

module.exports = router;
