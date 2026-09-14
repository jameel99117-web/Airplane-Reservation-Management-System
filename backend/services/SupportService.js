const SupportRequestModel = require('../models/SupportRequest');

class SupportService {
  async createSupportRequest(data) {
    const support = await SupportRequestModel.create(data);
    return this.#populate(support._id);
  }

  async getAllSupportRequests() {
    return SupportRequestModel.find()
      .populate('user', 'name email')
      .populate('booking', 'bookingReference')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 });
  }

  async getSupportRequestById(id) {
    const support = await SupportRequestModel.findById(id)
      .populate('user', 'name email')
      .populate('booking', 'bookingReference')
      .populate('assignedTo', 'name email');
    if (!support) throw new Error('Support request not found');
    return support;
  }

  async updateSupportRequest(id, updates) {
    const support = await SupportRequestModel.findById(id);
    if (!support) throw new Error('Support request not found');
    
    if (updates.status) {
      support.status = updates.status;
      if (updates.status === 'resolved') support.resolvedAt = new Date();
      if (updates.status === 'closed') support.closedAt = new Date();
    }
    if (updates.assignedTo) support.assignedTo = updates.assignedTo;
    if (updates.response !== undefined) support.response = updates.response;
    if (updates.priority) support.priority = updates.priority;
    
    await support.save();
    return this.#populate(support._id);
  }

  async #populate(id) {
    return SupportRequestModel.findById(id)
      .populate('user', 'name email')
      .populate('booking', 'bookingReference')
      .populate('assignedTo', 'name email');
  }
}

module.exports = new SupportService();
