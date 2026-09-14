const EmergencyContactModel = require('../models/EmergencyContact');

class EmergencyContactService {
  async createEmergencyContact({ userId, name, relationship, phone }) {
    if (!name || !relationship || !phone) {
      throw new Error('Name, relationship, and phone are required');
    }

    const phoneRegex = /^[0-9+\-\s()]{7,20}$/;
    if (!phoneRegex.test(phone)) {
      throw new Error('Invalid phone number format');
    }

    const contact = await EmergencyContactModel.create({
      user: userId,
      name,
      relationship,
      phone
    });

    return this.#populate(contact._id);
  }

  async getUserEmergencyContacts(userId) {
    return EmergencyContactModel.find({ user: userId }).sort({ createdAt: -1 });
  }

  async updateEmergencyContact(id, updates, userId) {
    const contact = await EmergencyContactModel.findById(id);
    if (!contact) throw new Error('Emergency contact not found');

    if (contact.user.toString() !== userId.toString()) {
      throw new Error('Not authorized to update this contact');
    }

    if (updates.name) contact.name = updates.name;
    if (updates.relationship) contact.relationship = updates.relationship;
    if (updates.phone) {
      const phoneRegex = /^[0-9+\-\s()]{7,20}$/;
      if (!phoneRegex.test(updates.phone)) {
        throw new Error('Invalid phone number format');
      }
      contact.phone = updates.phone;
    }

    await contact.save();
    return this.#populate(contact._id);
  }

  async deleteEmergencyContact(id, userId) {
    const contact = await EmergencyContactModel.findById(id);
    if (!contact) throw new Error('Emergency contact not found');

    if (contact.user.toString() !== userId.toString()) {
      throw new Error('Not authorized to delete this contact');
    }

    await EmergencyContactModel.findByIdAndDelete(id);
    return { message: 'Emergency contact deleted' };
  }

  async #populate(id) {
    return EmergencyContactModel.findById(id).populate('user', 'name email');
  }
}

module.exports = new EmergencyContactService();
