const TicketModel = require('../models/Ticket');
const BookingModel = require('../models/Booking');
const FlightModel = require('../models/Flight');

class TicketService {
  async generateTicketNumber() {
    const prefix = 'SKY';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  }

  async issueTicket(bookingId, issuedBy) {
    const booking = await BookingModel.findById(bookingId)
      .populate('flight')
      .populate('user');
    
    if (!booking) throw new Error('Booking not found');
    if (booking.status !== 'confirmed') throw new Error('Booking must be confirmed before issuing ticket');
    if (booking.paymentStatus !== 'success') throw new Error('Payment must be completed before issuing ticket');

    const existingTicket = await TicketModel.findOne({ booking: bookingId });
    if (existingTicket) throw new Error('Ticket already issued for this booking');

    const ticketNumber = await this.generateTicketNumber();
    
    const ticket = await TicketModel.create({
      ticketNumber,
      booking: bookingId,
      passenger: booking.user._id,
      flight: booking.flight._id,
      seatNumbers: booking.seatNumbers,
      passengerName: booking.passengerName,
      passengerEmail: booking.passengerEmail,
      basePrice: booking.flight.price * booking.seatNumbers.length,
      discountApplied: booking.discountApplied || 0,
      discountType: booking.discountType || null,
      finalPrice: booking.totalAmount,
      status: 'issued',
      issuedBy
    });

    return this.#populate(ticket._id);
  }

  async getTicketById(id) {
    const ticket = await TicketModel.findById(id)
      .populate('booking', 'bookingReference')
      .populate('passenger', 'name email')
      .populate('flight')
      .populate('issuedBy', 'name email');
    if (!ticket) throw new Error('Ticket not found');
    return ticket;
  }

  async getTicketsByBooking(bookingId) {
    return TicketModel.find({ booking: bookingId })
      .populate('booking', 'bookingReference')
      .populate('passenger', 'name email')
      .populate('flight')
      .populate('issuedBy', 'name email');
  }

  async getTicketsByPassenger(passengerId) {
    return TicketModel.find({ passenger: passengerId })
      .populate('booking', 'bookingReference')
      .populate('flight')
      .populate('issuedBy', 'name email')
      .sort({ createdAt: -1 });
  }

  async getAllTickets() {
    return TicketModel.find()
      .populate('booking', 'bookingReference')
      .populate('passenger', 'name email')
      .populate('flight')
      .populate('issuedBy', 'name email')
      .sort({ createdAt: -1 });
  }

  async cancelTicket(ticketId) {
    const ticket = await TicketModel.findById(ticketId);
    if (!ticket) throw new Error('Ticket not found');
    if (ticket.status === 'cancelled') throw new Error('Ticket already cancelled');
    
    ticket.status = 'cancelled';
    await ticket.save();
    
    const booking = await BookingModel.findById(ticket.booking);
    if (booking) {
      booking.status = 'cancelled';
      await booking.save();
    }
    
    return this.#populate(ticket._id);
  }

  async #populate(id) {
    return TicketModel.findById(id)
      .populate('booking', 'bookingReference')
      .populate('passenger', 'name email')
      .populate('flight')
      .populate('issuedBy', 'name email');
  }
}

module.exports = new TicketService();
