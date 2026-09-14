const BookingModel = require('../models/Booking');
const FlightModel = require('../models/Flight');
const Payment = require('../classes/Payment');
const BookingService = require('./BookingService');
const NotificationService = require('./NotificationService');
const LoyaltyProgramService = require('./LoyaltyProgramService');
const BaggageManagementService = require('./BaggageManagementService');
const PromoCodeService = require('./PromoCodeService');

class PaymentService {
  constructor(bookingService = BookingService) {
    this.#bookingService = bookingService;
  }

  #bookingService;

  async processPayment({ bookingId, method = 'card', cardLastFour = '4242' }) {
    const booking = await BookingModel.findById(bookingId);
    if (!booking) throw new Error('Booking not found');
    if (booking.status === 'cancelled') throw new Error('Booking is cancelled');
    if (booking.paymentStatus === 'success') throw new Error('Payment already completed');

    const amountDue = Math.max(0, booking.totalAmount - (booking.paidAmount || 0));
    if (amountDue <= 0) throw new Error('No payment due for this booking');

    const transactionId = Payment.generateTransactionId();
    const failed = Payment.shouldSimulateFailure(String(cardLastFour).slice(-4), amountDue);

    if (failed) {
      await this.#bookingService.releaseSeats(booking);
      booking.paymentStatus = 'failed';
      booking.status = 'cancelled';
      booking.paymentTransactionId = transactionId;
      booking.paymentMethod = method;
      booking.cancelledAt = new Date();
      await booking.save();

      const flight = await FlightModel.findById(booking.flight);
      await NotificationService.createNotification({
        user: booking.user,
        type: 'payment_failed',
        title: 'Payment Failed',
        message: `Your payment of $${amountDue} for booking ${booking.bookingReference} (${flight.source} → ${flight.destination}) has failed. Transaction ID: ${transactionId}`,
        status: 'failed',
        relatedId: booking._id,
        relatedType: 'payment'
      });

      const payment = new Payment({
        transactionId,
        bookingId,
        amount: amountDue,
        status: 'failed',
        method,
        message: 'Payment declined by gateway (simulated). Seats released.'
      });
      return payment.toObject();
    }

    booking.paymentStatus = 'success';
    booking.status = 'confirmed';
    booking.paymentTransactionId = transactionId;
    booking.paymentMethod = method;
    booking.paidAmount = booking.totalAmount;
    await booking.save();

    if (booking.promoCodeId) {
      try {
        await PromoCodeService.applyPromoCodeUsage(booking.promoCodeId);
      } catch (err) {
        console.error('Error applying promo code usage:', err);
      }
    }

    const flight = await FlightModel.findById(booking.flight);
    
    // Add loyalty points for the booking
    try {
      await LoyaltyProgramService.addPoints(
        booking.user,
        amountDue,
        booking.seatNumbers.length,
        booking._id,
        'booking'
      );
    } catch (err) {
      console.error('Error adding loyalty points:', err);
    }

    // Create baggage management record for the booking
    try {
      await BaggageManagementService.getOrCreateBaggageManagement(booking._id);
    } catch (err) {
      console.error('Error creating baggage management:', err);
    }

    await NotificationService.createNotification({
      user: booking.user,
      type: 'payment_successful',
      title: 'Payment Successful',
      message: `Your payment of $${amountDue} for booking ${booking.bookingReference} (${flight.source} → ${flight.destination}) was successful. Transaction ID: ${transactionId}`,
      status: 'success',
      relatedId: booking._id,
      relatedType: 'payment'
    });

    const payment = new Payment({
      transactionId,
      bookingId,
      amount: amountDue,
      status: 'success',
      method,
      message: 'Payment processed successfully (simulated gateway).'
    });
    return payment.toObject();
  }

  async getPaymentStatus(bookingId) {
    const booking = await BookingModel.findById(bookingId).select(
      'paymentStatus paymentTransactionId paymentMethod totalAmount paidAmount status bookingReference'
    );
    if (!booking) throw new Error('Booking not found');
    const amountDue = Math.max(0, booking.totalAmount - (booking.paidAmount || 0));
    return {
      bookingId: booking._id,
      bookingReference: booking.bookingReference,
      paymentStatus: booking.paymentStatus,
      transactionId: booking.paymentTransactionId,
      method: booking.paymentMethod,
      amount: booking.totalAmount,
      paidAmount: booking.paidAmount || 0,
      amountDue,
      bookingStatus: booking.status
    };
  }
}

module.exports = new PaymentService();
