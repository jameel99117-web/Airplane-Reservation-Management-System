const express = require('express');
const BookingController = require('../controllers/BookingController');
const authMiddleware = require('../middleware/authMiddleware');
const { ROLES } = require('../config/roles');

const router = express.Router();

router.use(authMiddleware.authenticate.bind(authMiddleware));

router.post(
  '/',
  authMiddleware.requireRoles(ROLES.PASSENGER, ROLES.AGENT, ROLES.ADMIN).bind(authMiddleware),
  BookingController.createBooking
);
router.get('/my', BookingController.getMyBookings);
router.get(
  '/all',
  authMiddleware.requireRoles(ROLES.ADMIN, ROLES.AGENT).bind(authMiddleware),
  BookingController.getAllBookings
);
router.patch(
  '/:id',
  authMiddleware.requireRoles(ROLES.AGENT, ROLES.ADMIN).bind(authMiddleware),
  BookingController.updateBooking
);
router.get('/:id/reschedule-options', BookingController.getRescheduleOptions);
router.post('/:id/reschedule', BookingController.rescheduleBooking);
router.post('/:id/cancel', BookingController.cancelBooking);
router.get('/:id', BookingController.getBooking);

module.exports = router;
