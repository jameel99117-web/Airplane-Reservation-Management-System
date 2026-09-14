const PromoCodeModel = require('../models/PromoCode');
const BookingModel = require('../models/Booking');

class PromoCodeService {
  async createPromoCode(data, adminId) {
    const code = String(data.code).trim().toUpperCase();
    const existing = await PromoCodeModel.findOne({ code });
    if (existing) throw new Error('Promo code already exists');

    if (data.discountType === 'percentage' && data.discountValue > 100) {
      throw new Error('Percentage discount cannot exceed 100%');
    }

    const promo = await PromoCodeModel.create({
      code,
      description: data.description || '',
      discountType: data.discountType,
      discountValue: data.discountValue,
      expiresAt: new Date(data.expiresAt),
      usageLimit: data.usageLimit,
      minOrderAmount: data.minOrderAmount || 0,
      isActive: data.isActive !== false,
      createdBy: adminId
    });
    return promo;
  }

  async getAllPromoCodes() {
    return PromoCodeModel.find()
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
  }

  async getPromoCodeById(id) {
    const promo = await PromoCodeModel.findById(id).populate('createdBy', 'name email');
    if (!promo) throw new Error('Promo code not found');
    return promo;
  }

  async updatePromoCode(id, data) {
    const promo = await PromoCodeModel.findById(id);
    if (!promo) throw new Error('Promo code not found');

    if (data.code && data.code.toUpperCase() !== promo.code) {
      const existing = await PromoCodeModel.findOne({ code: data.code.toUpperCase() });
      if (existing) throw new Error('Promo code already exists');
      promo.code = data.code.toUpperCase();
    }

    if (data.description !== undefined) promo.description = data.description;
    if (data.discountType) promo.discountType = data.discountType;
    if (data.discountValue !== undefined) {
      const type = data.discountType || promo.discountType;
      if (type === 'percentage' && data.discountValue > 100) {
        throw new Error('Percentage discount cannot exceed 100%');
      }
      promo.discountValue = data.discountValue;
    }
    if (data.expiresAt) promo.expiresAt = new Date(data.expiresAt);
    if (data.usageLimit !== undefined) promo.usageLimit = data.usageLimit;
    if (data.minOrderAmount !== undefined) promo.minOrderAmount = data.minOrderAmount;
    if (data.isActive !== undefined) promo.isActive = data.isActive;

    await promo.save();
    return promo;
  }

  async deletePromoCode(id) {
    const promo = await PromoCodeModel.findByIdAndDelete(id);
    if (!promo) throw new Error('Promo code not found');
    return { message: 'Promo code deleted' };
  }

  async validatePromoCode(code, amount) {
    if (!code) {
      return {
        valid: false,
        message: 'Promo code is required'
      };
    }

    const promo = await PromoCodeModel.findOne({ code: code.trim().toUpperCase() });
    if (!promo) {
      return { valid: false, message: 'Invalid promo code' };
    }

    if (!promo.isActive) {
      return { valid: false, message: 'This promo code is no longer active' };
    }

    if (new Date() > new Date(promo.expiresAt)) {
      return { valid: false, message: 'This promo code has expired' };
    }

    if (promo.usageCount >= promo.usageLimit) {
      return { valid: false, message: 'This promo code has reached its usage limit' };
    }

    if (amount < promo.minOrderAmount) {
      return {
        valid: false,
        message: `Minimum order amount of $${promo.minOrderAmount} required for this code`
      };
    }

    let discountApplied = 0;
    if (promo.discountType === 'percentage') {
      discountApplied = (promo.discountValue / 100) * amount;
    } else {
      discountApplied = promo.discountValue;
    }

    discountApplied = Math.min(discountApplied, amount);
    const finalAmount = Math.max(0, amount - discountApplied);

    return {
      valid: true,
      message: 'Promo code applied successfully',
      promoCodeId: promo._id,
      code: promo.code,
      discountType: promo.discountType,
      discountValue: promo.discountValue,
      discountApplied: Math.round(discountApplied * 100) / 100,
      originalAmount: amount,
      finalAmount: Math.round(finalAmount * 100) / 100,
      remainingUses: promo.usageLimit - promo.usageCount
    };
  }

  async applyPromoCodeUsage(promoCodeId) {
    if (!promoCodeId) return;
    const promo = await PromoCodeModel.findById(promoCodeId);
    if (!promo) return;
    promo.usageCount += 1;
    await promo.save();
  }

  async getPromoCodeUsage(id) {
    const promo = await PromoCodeModel.findById(id);
    if (!promo) throw new Error('Promo code not found');

    const bookings = await BookingModel.find({ promoCodeId: id })
      .populate('user', 'name email role')
      .populate('flight', 'flightNumber source destination')
      .sort({ createdAt: -1 });

    return {
      promoCode: promo.code,
      usageCount: promo.usageCount,
      usageLimit: promo.usageLimit,
      redemptions: bookings.map((booking) => ({
        user: booking.user,
        bookingReference: booking.bookingReference,
        discountApplied: booking.discountApplied,
        totalAmount: booking.totalAmount,
        originalAmount: booking.originalAmount,
        paymentStatus: booking.paymentStatus,
        status: booking.status,
        flight: booking.flight,
        redeemed: booking.paymentStatus === 'success',
        bookedAt: booking.createdAt,
        redeemedAt: booking.paymentStatus === 'success' ? booking.updatedAt : null
      })),
      redeemedCount: bookings.filter((b) => b.paymentStatus === 'success').length,
      pendingCount: bookings.filter((b) => b.paymentStatus === 'pending').length
    };
  }
}

module.exports = new PromoCodeService();
