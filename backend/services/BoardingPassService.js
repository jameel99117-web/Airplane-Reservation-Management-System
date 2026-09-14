const BookingModel = require('../models/Booking');
const FlightModel = require('../models/Flight');
const TicketModel = require('../models/Ticket');

class BoardingPassService {
  async generateBoardingPass(bookingId, userId) {
    const booking = await BookingModel.findById(bookingId)
      .populate('flight')
      .populate('user', 'name email');
    
    if (!booking) throw new Error('Booking not found');
    
    if (booking.user._id.toString() !== userId.toString()) {
      throw new Error('Not authorized to generate boarding pass for this booking');
    }

    if (booking.status !== 'confirmed') {
      throw new Error('Boarding pass can only be generated for confirmed bookings');
    }

    const ticket = await TicketModel.findOne({ booking: bookingId });
    const flight = booking.flight;
    const passengers = booking.passengers && booking.passengers.length > 0 
      ? booking.passengers 
      : [{ name: booking.passengerName, email: booking.passengerEmail }];

    return {
      bookingReference: booking.bookingReference,
      ticketNumber: ticket ? ticket.ticketNumber : `BP-${booking.bookingReference}`,
      flightNumber: flight.flightNumber,
      airline: flight.airline,
      source: flight.source,
      destination: flight.destination,
      departureDate: new Date(flight.departureDate).toLocaleDateString(),
      departureTime: flight.departureTime,
      arrivalTime: flight.arrivalTime,
      seatNumbers: booking.seatNumbers,
      passengers: passengers,
      totalAmount: booking.totalAmount,
      issuedAt: ticket ? ticket.issuedAt : booking.createdAt
    };
  }

  async getUserBoardingPasses(userId) {
    const bookings = await BookingModel.find({ user: userId, status: 'confirmed' })
      .populate('flight')
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    const boardingPasses = [];
    for (const booking of bookings) {
      const ticket = await TicketModel.findOne({ booking: booking._id });
      if (ticket) {
        const flight = booking.flight;
        const passengers = booking.passengers && booking.passengers.length > 0 
          ? booking.passengers 
          : [{ name: booking.passengerName, email: booking.passengerEmail }];

        boardingPasses.push({
          bookingReference: booking.bookingReference,
          ticketNumber: ticket.ticketNumber,
          flightNumber: flight.flightNumber,
          airline: flight.airline,
          source: flight.source,
          destination: flight.destination,
          departureDate: new Date(flight.departureDate).toLocaleDateString(),
          departureTime: flight.departureTime,
          arrivalTime: flight.arrivalTime,
          seatNumbers: booking.seatNumbers,
          passengers: passengers,
          totalAmount: booking.totalAmount,
          issuedAt: ticket.issuedAt
        });
      }
    }

    return boardingPasses;
  }
}

module.exports = new BoardingPassService();
