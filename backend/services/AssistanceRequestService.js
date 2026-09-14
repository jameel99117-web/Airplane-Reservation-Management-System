const AssistanceRequestModel = require('../models/AssistanceRequest');
const BookingModel = require('../models/Booking');

class AssistanceRequestService {
  async createAssistanceRequest({ userId, bookingId, assistanceType, notes }) {
    const validTypes = ['wheelchair', 'medical', 'elderly', 'special'];
    if (!validTypes.includes(assistanceType)) {
      throw new Error('Invalid assistance type');
    }

    const booking = await BookingModel.findById(bookingId);
    if (!booking) throw new Error('Booking not found');

    if (booking.user.toString() !== userId.toString()) {
      throw new Error('You can only request assistance for your own bookings');
    }

    const existingRequest = await AssistanceRequestModel.findOne({ booking: bookingId });
    if (existingRequest) {
      throw new Error('Assistance request already exists for this booking');
    }

    const request = await AssistanceRequestModel.create({
      user: userId,
      booking: bookingId,
      assistanceType,
      notes: notes || ''
    });

    return this.#populate(request._id);
  }

  async getUserAssistanceRequests(userId) {
    return AssistanceRequestModel.find({ user: userId })
      .populate('booking')
      .sort({ createdAt: -1 });
  }

  async updateAssistanceStatus(id, status, requester) {
    const request = await AssistanceRequestModel.findById(id);
    if (!request) throw new Error('Assistance request not found');

    const validStatuses = ['requested', 'approved', 'completed', 'denied'];
    if (!validStatuses.includes(status)) {
      throw new Error('Invalid status');
    }

    request.status = status;
    await request.save();

    return this.#populate(request._id);
  }

  async #populate(id) {
    return AssistanceRequestModel.findById(id)
      .populate('booking')
      .populate('user', 'name email');
  }
}

module.exports = new AssistanceRequestService();
