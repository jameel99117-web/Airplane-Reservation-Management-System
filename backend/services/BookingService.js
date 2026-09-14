const BookingModel = require('../models/Booking');
const FlightModel = require('../models/Flight');
const Booking = require('../classes/Booking');
const PromoCodeService = require('./PromoCodeService');
const NotificationService = require('./NotificationService');
const { ROLES } = require('../config/roles');

class BookingService {
  async #validateAndReserveSeats(flight, seatNumbers) {
    if (!seatNumbers?.length) throw new Error('At least one seat must be selected');
    for (const seatNum of seatNumbers) {
      const seat = flight.seats.find((s) => s.seatNumber === seatNum);
      if (!seat) throw new Error(`Seat ${seatNum} does not exist`);
      if (seat.isBooked) throw new Error(`Seat ${seatNum} is already booked`);
    }
    seatNumbers.forEach((seatNum) => {
      flight.seats.find((s) => s.seatNumber === seatNum).isBooked = true;
    });
    await flight.save();
  }

  async #calculateDiscount(amount, discountCode) {
    if (!discountCode) {
      return {
        finalAmount: amount,
        discountApplied: 0,
        discountType: null,
        promoCode: null,
        promoCodeId: null,
        originalAmount: amount
      };
    }

    const result = await PromoCodeService.validatePromoCode(discountCode, amount);
    if (!result.valid) {
      throw new Error(result.message);
    }

    return {
      finalAmount: result.finalAmount,
      discountApplied: result.discountApplied,
      discountType: result.discountType,
      promoCode: result.code,
      promoCodeId: result.promoCodeId,
      originalAmount: amount
    };
  }

  async releaseSeats(booking) {
    const flight = await FlightModel.findById(booking.flight);
    if (!flight) return;
    booking.seatNumbers.forEach((seatNum) => {
      const seat = flight.seats.find((s) => s.seatNumber === seatNum);
      if (seat) seat.isBooked = false;
    });
    await flight.save();
  }

  async createBooking({
    userId,
    flightId,
    seatNumbers,
    passengerName,
    passengerEmail,
    passengers,
    specialRequest = '',
    bookedById = null,
    discountCode = null
  }) {
    const flight = await FlightModel.findById(flightId);
    if (!flight) throw new Error('Flight not found');

    await this.#validateAndReserveSeats(flight, seatNumbers);

    const bookingEntity = new Booking({
      userId,
      flightId,
      seatNumbers,
      passengerName,
      passengerEmail,
      passengers,
      status: 'pending_payment',
      bookingReference: Booking.generateReference()
    });
    bookingEntity.calculateTotal(flight.price, seatNumbers.length);

    const {
      finalAmount,
      discountApplied,
      discountType,
      promoCode,
      promoCodeId,
      originalAmount
    } = await this.#calculateDiscount(bookingEntity.toObject().totalAmount, discountCode);

    try {
      const doc = await BookingModel.create({
        user: userId,
        flight: flightId,
        seatNumbers,
        passengerName,
        passengerEmail,
        passengers,
        totalAmount: finalAmount,
        originalAmount,
        bookingReference: bookingEntity.toObject().bookingReference,
        status: 'pending_payment',
        paymentStatus: 'pending',
        specialRequest,
        bookedBy: bookedById,
        promoCode,
        promoCodeId,
        discountApplied,
        discountType
      });
      return this.#populate(doc._id);
    } catch (err) {
      await this.releaseSeats({ flight: flightId, seatNumbers });
      throw err;
    }
  }

  async #populate(id) {
    return BookingModel.findById(id)
      .populate('flight')
      .populate('user', 'name email role')
      .populate('bookedBy', 'name email role');
  }

  async #assertCanModifyBooking(booking, requester) {
    const role = requester.role === 'user' ? ROLES.PASSENGER : requester.role;
    const isOwner = booking.user.toString() === requester._id.toString();
    const isStaff = [ROLES.AGENT, ROLES.ADMIN].includes(role);

    if (role === ROLES.PASSENGER && !isOwner) {
      throw new Error('You can only modify your own bookings');
    }
    if (!isOwner && !isStaff) {
      throw new Error('Not authorized to modify this booking');
    }
  }

  #assertFlightNotDeparted(flight, label = 'flight') {
    if (new Date(flight.departureDate) <= new Date()) {
      throw new Error(`Cannot reschedule — the ${label} has already departed`);
    }
  }

  async #recalculateBookingAmount(baseAmount, promoCode) {
    if (!promoCode) {
      return {
        finalAmount: baseAmount,
        discountApplied: 0,
        discountType: null,
        promoCode: null,
        promoCodeId: null,
        originalAmount: baseAmount
      };
    }

    return this.#calculateDiscount(baseAmount, promoCode);
  }

  async rescheduleBooking(bookingId, { newFlightId, seatNumbers }, requester) {
    const booking = await BookingModel.findById(bookingId);
    if (!booking) throw new Error('Booking not found');
    if (['cancelled', 'refunded'].includes(booking.status)) {
      throw new Error('Cannot reschedule a cancelled or refunded booking');
    }

    await this.#assertCanModifyBooking(booking, requester);

    const oldFlight = await FlightModel.findById(booking.flight);
    if (!oldFlight) throw new Error('Current flight not found');
    this.#assertFlightNotDeparted(oldFlight, 'current flight');

    const newFlight = await FlightModel.findById(newFlightId);
    if (!newFlight) throw new Error('New flight not found');
    this.#assertFlightNotDeparted(newFlight, 'selected flight');

    const seats = seatNumbers?.length ? seatNumbers : booking.seatNumbers;
    if (seats.length !== booking.seatNumbers.length) {
      throw new Error(`Please select exactly ${booking.seatNumbers.length} seat(s)`);
    }

    const sameFlightAndSeats =
      booking.flight.toString() === newFlightId &&
      seats.length === booking.seatNumbers.length &&
      seats.every((seat) => booking.seatNumbers.includes(seat));

    if (sameFlightAndSeats) {
      throw new Error('Booking is already on this flight with the same seats');
    }

    const previousFlightId = booking.flight;
    const previousPaidAmount = booking.paidAmount || 0;

    await this.releaseSeats(booking);

    try {
      await this.#validateAndReserveSeats(newFlight, seats);
    } catch (err) {
      await this.#validateAndReserveSeats(oldFlight, booking.seatNumbers);
      throw err;
    }

    const baseAmount = newFlight.price * seats.length;
    const pricing = await this.#recalculateBookingAmount(baseAmount, booking.promoCode);

    booking.flight = newFlightId;
    booking.seatNumbers = seats;
    booking.totalAmount = pricing.finalAmount;
    booking.originalAmount = pricing.originalAmount;
    booking.discountApplied = pricing.discountApplied;
    booking.discountType = pricing.discountType;
    booking.promoCode = pricing.promoCode ?? booking.promoCode;
    booking.promoCodeId = pricing.promoCodeId ?? booking.promoCodeId;
    booking.rescheduledFrom = previousFlightId;
    booking.rescheduledAt = new Date();
    booking.rescheduleCount = (booking.rescheduleCount || 0) + 1;

    const amountDue = Math.max(0, pricing.finalAmount - previousPaidAmount);
    if (booking.paymentStatus === 'success' && amountDue > 0) {
      booking.paymentStatus = 'pending';
      booking.status = 'pending_payment';
    } else if (booking.paymentStatus === 'success') {
      booking.status = 'confirmed';
    }

    await booking.save();

    const oldRoute = `${oldFlight.source} → ${oldFlight.destination}`;
    const newRoute = `${newFlight.source} → ${newFlight.destination}`;
    const paymentNote =
      amountDue > 0 ? ` Additional payment of $${amountDue} is required.` : '';

    await NotificationService.createNotification({
      user: booking.user,
      type: 'booking_rescheduled',
      title: 'Booking Rescheduled',
      message: `Your booking ${booking.bookingReference} has been rescheduled from ${oldRoute} to ${newRoute}.${paymentNote}`,
      status: booking.status,
      relatedId: booking._id,
      relatedType: 'booking'
    });

    return this.#populate(booking._id);
  }

  async getRescheduleOptions(bookingId, requester) {
    const booking = await BookingModel.findById(bookingId).populate('flight');
    if (!booking) throw new Error('Booking not found');
    if (['cancelled', 'refunded'].includes(booking.status)) {
      throw new Error('Cannot reschedule a cancelled or refunded booking');
    }

    await this.#assertCanModifyBooking(booking, requester);

    const flights = await FlightModel.find({
      departureDate: { $gt: new Date() },
      _id: { $ne: booking.flight._id || booking.flight }
    }).sort({ departureDate: 1 });

    return {
      booking: {
        id: booking._id,
        bookingReference: booking.bookingReference,
        seatNumbers: booking.seatNumbers,
        seatCount: booking.seatNumbers.length,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        totalAmount: booking.totalAmount,
        paidAmount: booking.paidAmount || 0,
        promoCode: booking.promoCode,
        rescheduleCount: booking.rescheduleCount || 0,
        currentFlight: booking.flight
      },
      availableFlights: flights
    };
  }

  async cancelBooking(bookingId, requester) {
    const booking = await BookingModel.findById(bookingId);
    if (!booking) throw new Error('Booking not found');
    if (booking.status === 'cancelled') throw new Error('Booking already cancelled');

    const role = requester.role === 'user' ? ROLES.PASSENGER : requester.role;
    const isOwner = booking.user.toString() === requester._id.toString();
    const isStaff = [ROLES.AGENT, ROLES.ADMIN].includes(role);

    if (role === ROLES.PASSENGER && !isOwner) {
      throw new Error('You can only cancel your own bookings');
    }
    if (!isOwner && !isStaff) {
      throw new Error('Not authorized to cancel this booking');
    }

    await this.releaseSeats(booking);
    booking.status = 'cancelled';
    booking.cancelledAt = new Date();
    if (booking.paymentStatus === 'pending') booking.paymentStatus = 'failed';
    await booking.save();

    const flight = await FlightModel.findById(booking.flight);
    await NotificationService.createNotification({
      user: booking.user,
      type: 'booking_cancellation',
      title: 'Booking Cancelled',
      message: `Your booking ${booking.bookingReference} for ${flight.source} → ${flight.destination} has been cancelled.`,
      status: booking.status,
      relatedId: booking._id,
      relatedType: 'booking'
    });

    return this.#populate(booking._id);
  }

  async updateBooking(bookingId, updates, requester) {
    const role = requester.role === 'user' ? ROLES.PASSENGER : requester.role;
    if (role !== ROLES.AGENT && role !== ROLES.ADMIN) {
      throw new Error('Only reservation agents or admins can modify bookings');
    }

    const booking = await BookingModel.findById(bookingId);
    if (!booking) throw new Error('Booking not found');
    if (booking.status === 'cancelled') throw new Error('Cannot modify cancelled booking');

    const previousStatus = booking.status;

    if (updates.passengerName) booking.passengerName = updates.passengerName;
    if (updates.passengerEmail) booking.passengerEmail = updates.passengerEmail;
    if (updates.specialRequest !== undefined) booking.specialRequest = updates.specialRequest;

    if (updates.seatNumbers?.length) {
      const flight = await FlightModel.findById(booking.flight);
      await this.releaseSeats(booking);
      await this.#validateAndReserveSeats(flight, updates.seatNumbers);
      booking.seatNumbers = updates.seatNumbers;
      booking.totalAmount = flight.price * updates.seatNumbers.length;
    }

    await booking.save();

    if (updates.status && updates.status === 'confirmed' && previousStatus !== 'confirmed') {
      const flight = await FlightModel.findById(booking.flight);
      await NotificationService.createNotification({
        user: booking.user,
        type: 'booking_confirmation',
        title: 'Booking Confirmed',
        message: `Your booking ${booking.bookingReference} for ${flight.source} → ${flight.destination} has been confirmed.`,
        status: booking.status,
        relatedId: booking._id,
        relatedType: 'booking'
      });
    }

    return this.#populate(booking._id);
  }

  async getUserBookings(userId) {
    return BookingModel.find({ user: userId })
      .populate('flight')
      .populate('bookedBy', 'name email')
      .sort({ createdAt: -1 });
  }

  async getAllBookings() {
    return BookingModel.find()
      .populate('flight')
      .populate('user', 'name email role')
      .populate('bookedBy', 'name email')
      .sort({ createdAt: -1 });
  }

  async getBookingById(id) {
    const doc = await this.#populate(id);
    if (!doc) throw new Error('Booking not found');
    return doc;
  }
}

module.exports = new BookingService();
