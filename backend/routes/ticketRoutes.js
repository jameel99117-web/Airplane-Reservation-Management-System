const express = require('express');
const TicketController = require('../controllers/TicketController');
const authMiddleware = require('../middleware/authMiddleware');
const { ROLES } = require('../config/roles');

const router = express.Router();

router.use(authMiddleware.authenticate.bind(authMiddleware));
router.use(authMiddleware.requireRoles(ROLES.ADMIN, ROLES.MANAGER, ROLES.AGENT).bind(authMiddleware));

router.post('/', TicketController.issueTicket);
router.get('/', TicketController.getAllTickets);
router.get('/:id', TicketController.getTicketById);
router.get('/booking/:bookingId', TicketController.getTicketsByBooking);
router.get('/passenger/:passengerId', TicketController.getTicketsByPassenger);
router.patch('/:id/cancel', TicketController.cancelTicket);

module.exports = router;
