const FeedbackModel = require('../models/Feedback');
const BookingModel = require('../models/Booking');

class FeedbackService {
  async createFeedback({ userId, bookingId, rating, comment }) {
    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    const booking = await BookingModel.findById(bookingId);
    if (!booking) {
      throw new Error('Booking not found');
    }

    if (booking.user.toString() !== userId.toString()) {
      throw new Error('You can only submit feedback for your own bookings');
    }

    if (booking.status !== 'confirmed' && booking.status !== 'refunded') {
      throw new Error('Feedback can only be submitted for confirmed or refunded bookings');
    }

    const existingFeedback = await FeedbackModel.findOne({ user: userId, booking: bookingId });
    if (existingFeedback) {
      throw new Error('Feedback already submitted for this booking');
    }

    const feedback = await FeedbackModel.create({
      user: userId,
      booking: bookingId,
      flight: booking.flight,
      rating,
      comment
    });

    return this.#populate(feedback._id);
  }

  async getUserFeedback(userId) {
    return FeedbackModel.find({ user: userId })
      .populate('booking')
      .populate('flight')
      .sort({ createdAt: -1 });
  }

  async getFeedbackById(id) {
    const feedback = await FeedbackModel.findById(id)
      .populate('booking')
      .populate('flight')
      .populate('user', 'name email');
    if (!feedback) throw new Error('Feedback not found');
    return feedback;
  }

  async getAllFeedback() {
    return FeedbackModel.find()
      .populate('booking')
      .populate('flight')
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
  }

  async #populate(id) {
    return FeedbackModel.findById(id)
      .populate('booking')
      .populate('flight')
      .populate('user', 'name email');
  }
}

module.exports = new FeedbackService();
