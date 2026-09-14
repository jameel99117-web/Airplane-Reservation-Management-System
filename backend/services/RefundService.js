const RefundModel = require('../models/Refund');
const BookingModel = require('../models/Booking');
const NotificationService = require('./NotificationService');
const { ROLES } = require('../config/roles');

class RefundService {
  async createRefundRequest({ bookingId, userId, reason }) {
    const booking = await BookingModel.findById(bookingId).populate('flight');
    if (!booking) throw new Error('Booking not found');

    if (booking.user.toString() !== userId.toString()) {
      throw new Error('You can only request refund for your own bookings');
    }

    if (booking.status !== 'confirmed') {
      throw new Error(`Refunds are only available for confirmed bookings. Current status: ${booking.status}`);
    }

    if (booking.paymentStatus !== 'success') {
      throw new Error(`Refunds are only available for paid bookings. Current payment status: ${booking.paymentStatus}`);
    }

    const existingRefund = await RefundModel.findOne({ booking: bookingId });
    if (existingRefund) {
      throw new Error('A refund request already exists for this booking');
    }

    const refund = await RefundModel.create({
      booking: bookingId,
      user: userId,
      amount: booking.totalAmount,
      reason
    });

    await NotificationService.createNotification({
      user: userId,
      type: 'refund_pending',
      title: 'Refund Request Submitted',
      message: `Your refund request of $${booking.totalAmount} for booking ${booking.bookingReference} has been submitted and is pending review.`,
      status: 'pending',
      relatedId: refund._id,
      relatedType: 'refund'
    });

    return this.#populate(refund._id);
  }
  
  async getUserRefunds(userId) {
    return RefundModel.find({ user: userId })
      .populate('booking')
      .populate('booking.flight')
      .populate('processedBy', 'name email')
      .sort({ createdAt: -1 });
  }
  
  async getAllRefunds() {
    return RefundModel.find()
      .populate('booking')
      .populate('booking.flight')
      .populate('user', 'name email')
      .populate('processedBy', 'name email')
      .sort({ createdAt: -1 });
  }
  
  async updateRefundStatus(refundId, status, processedBy, notes = '') {
    const refund = await RefundModel.findById(refundId);
    if (!refund) throw new Error('Refund request not found');
    
    if (refund.status !== 'pending') {
      throw new Error('This refund request has already been processed');
    }
    
    refund.status = status;
    refund.processedBy = processedBy;
    refund.processedAt = new Date();
    if (notes) refund.notes = notes;
    
    await refund.save();
    
    if (status === 'approved') {
      const booking = await BookingModel.findById(refund.booking);
      if (booking) {
        booking.status = 'refunded';
        await booking.save();
      }
      
      await NotificationService.createNotification({
        user: refund.user,
        type: 'refund_approved',
        title: 'Refund Approved',
        message: `Your refund request of $${refund.amount} has been approved. The refund will be processed shortly.`,
        status: 'approved',
        relatedId: refund._id,
        relatedType: 'refund'
      });
    } else if (status === 'rejected') {
      await NotificationService.createNotification({
        user: refund.user,
        type: 'refund_rejected',
        title: 'Refund Rejected',
        message: `Your refund request of $${refund.amount} has been rejected. ${notes ? 'Reason: ' + notes : ''}`,
        status: 'rejected',
        relatedId: refund._id,
        relatedType: 'refund'
      });
    } else if (status === 'completed') {
      await NotificationService.createNotification({
        user: refund.user,
        type: 'refund_completed',
        title: 'Refund Completed',
        message: `Your refund of $${refund.amount} has been completed and credited to your account.`,
        status: 'completed',
        relatedId: refund._id,
        relatedType: 'refund'
      });
    }
    
    return this.#populate(refund._id);
  }
  
  async #populate(id) {
    return RefundModel.findById(id)
      .populate('booking')
      .populate('booking.flight')
      .populate('user', 'name email')
      .populate('processedBy', 'name email');
  }
}

module.exports = new RefundService();
