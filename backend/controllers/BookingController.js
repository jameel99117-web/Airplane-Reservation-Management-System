const BookingService = require('../services/BookingService');
const { ROLES } = require('../config/roles');

class BookingController {
  constructor(service = BookingService) {
    this.#service = service;
  }

  #service;

  #handleError(res, error, statusCode = 400) {
    res.status(statusCode).json({ success: false, message: error.message });
  }

  createBooking = async (req, res) => {
    try {
      const {
        flightId,
        seatNumbers,
        passengerName,
        passengerEmail,
        specialRequest,
        passengerUserId,
        passengers,
        discountCode
      } = req.body;

      if (!flightId || !seatNumbers) {
        return res.status(400).json({
          success: false,
          message: 'flightId and seatNumbers are required'
        });
      }

      const role = req.userRole;
      let userId = req.user._id;
      let bookedById = null;

      if ([ROLES.AGENT, ROLES.ADMIN].includes(role) && passengerUserId) {
        userId = passengerUserId;
        bookedById = req.user._id;
      }

      const booking = await this.#service.createBooking({
        userId,
        flightId,
        seatNumbers: Array.isArray(seatNumbers) ? seatNumbers : [seatNumbers],
        passengerName,
        passengerEmail,
        passengers,
        specialRequest: specialRequest || '',
        bookedById,
        discountCode
      });

      res.status(201).json({
        success: true,
        message: 'Booking created. Proceed to payment.',
        data: booking
      });
    } catch (error) {
      this.#handleError(res, error);
    }
  };

  getMyBookings = async (req, res) => {
    try {
      const bookings = await this.#service.getUserBookings(req.user._id);
      res.json({ success: true, count: bookings.length, data: bookings });
    } catch (error) {
      this.#handleError(res, error, 500);
    }
  };

  getAllBookings = async (req, res) => {
    try {
      const bookings = await this.#service.getAllBookings();
      res.json({ success: true, count: bookings.length, data: bookings });
    } catch (error) {
      this.#handleError(res, error, 500);
    }
  };

  getBooking = async (req, res) => {
    try {
      const booking = await this.#service.getBookingById(req.params.id);
      res.json({ success: true, data: booking });
    } catch (error) {
      this.#handleError(res, error, 404);
    }
  };

  cancelBooking = async (req, res) => {
    try {
      const booking = await this.#service.cancelBooking(req.params.id, req.user);
      res.json({ success: true, message: 'Booking cancelled', data: booking });
    } catch (error) {
      this.#handleError(res, error);
    }
  };

  updateBooking = async (req, res) => {
    try {
      const booking = await this.#service.updateBooking(req.params.id, req.body, req.user);
      res.json({ success: true, message: 'Booking updated', data: booking });
    } catch (error) {
      this.#handleError(res, error);
    }
  };

  getRescheduleOptions = async (req, res) => {
    try {
      const options = await this.#service.getRescheduleOptions(req.params.id, req.user);
      res.json({ success: true, data: options });
    } catch (error) {
      this.#handleError(res, error);
    }
  };

  rescheduleBooking = async (req, res) => {
    try {
      const { newFlightId, seatNumbers } = req.body;
      if (!newFlightId) {
        return res.status(400).json({
          success: false,
          message: 'newFlightId is required'
        });
      }

      const booking = await this.#service.rescheduleBooking(
        req.params.id,
        {
          newFlightId,
          seatNumbers: Array.isArray(seatNumbers) ? seatNumbers : seatNumbers ? [seatNumbers] : undefined
        },
        req.user
      );

      const amountDue = Math.max(0, booking.totalAmount - (booking.paidAmount || 0));
      const message =
        amountDue > 0
          ? `Booking rescheduled. Please pay the remaining $${amountDue}.`
          : 'Booking rescheduled successfully.';

      res.json({ success: true, message, data: booking });
    } catch (error) {
      this.#handleError(res, error);
    }
  };
}

module.exports = new BookingController();
