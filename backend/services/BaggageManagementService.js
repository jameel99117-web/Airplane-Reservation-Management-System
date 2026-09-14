const BaggageManagementModel = require('../models/BaggageManagement');
const BookingModel = require('../models/Booking');
const FlightModel = require('../models/Flight');
const LoyaltyProgramModel = require('../models/LoyaltyProgram');
const BaggageManagement = require('../classes/BaggageManagement');

class BaggageManagementService {
  async getOrCreateBaggageManagement(bookingId) {
    let baggage = await BaggageManagementModel.findOne({ booking: bookingId });
    if (!baggage) {
      const booking = await BookingModel.findById(bookingId).populate('flight');
      if (!booking) throw new Error('Booking not found');

      const loyaltyProgram = await LoyaltyProgramModel.findOne({ user: booking.user });
      const tier = loyaltyProgram ? loyaltyProgram.tier : 'silver';

      const baggageEntity = new BaggageManagement({
        bookingId: booking._id,
        userId: booking.user,
        flightId: booking.flight._id,
        tier,
        allowedWeight: 20
      });

      const routeType = this.determineRouteType(booking.flight);
      const allowedWeight = baggageEntity.calculateAllowedWeight(routeType);

      baggage = await BaggageManagementModel.create({
        booking: bookingId,
        user: booking.user,
        flight: booking.flight._id,
        tier,
        allowedWeight
      });
    }
    return baggage;
  }

  determineRouteType(flight) {
    const distance = flight.distance || 0;
    if (distance > 5000) return 'longHaul';
    if (flight.source !== flight.destination && this.isInternationalRoute(flight.source, flight.destination)) {
      return 'international';
    }
    return 'domestic';
  }

  isInternationalRoute(source, destination) {
    const internationalRoutes = ['USA', 'UK', 'UAE', 'SGP', 'JPN', 'AUS'];
    return internationalRoutes.some(code => 
      source.includes(code) || destination.includes(code)
    );
  }

  async getBaggageByBooking(bookingId) {
    const baggage = await BaggageManagementModel.findOne({ booking: bookingId })
      .populate('booking')
      .populate('user', 'name email')
      .populate('flight');
    if (!baggage) throw new Error('Baggage information not found for this booking');
    return baggage;
  }

  async addBaggageItem(bookingId, baggageItem) {
    const baggage = await this.getOrCreateBaggageManagement(bookingId);
    
    const baggageEntity = new BaggageManagement({
      bookingId: baggage.booking,
      userId: baggage.user,
      flightId: baggage.flight,
      tier: baggage.tier,
      baggageItems: baggage.baggageItems,
      allowedWeight: baggage.allowedWeight
    });

    const validation = baggageEntity.validateBaggageItem(baggageItem);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    baggage.baggageItems.push({
      ...baggageItem,
      isExcess: false,
      feeApplied: 0
    });

    baggage.totalWeight = baggageEntity.calculateTotalWeight();
    
    const flight = await FlightModel.findById(baggage.flight);
    const routeType = this.determineRouteType(flight);
    const feeCalculation = baggageEntity.calculateExcessFee(baggage.totalWeight, routeType);
    baggage.excessWeight = feeCalculation.excessWeight;
    baggage.totalFee = feeCalculation.fee;

    baggage.baggageItems.forEach(item => {
      if (baggage.totalWeight > baggage.allowedWeight) {
        item.isExcess = true;
        item.feeApplied = (item.weight / baggage.totalWeight) * baggage.totalFee;
      }
    });

    await baggage.save();
    return this.getBaggageByBooking(bookingId);
  }

  async removeBaggageItem(bookingId, itemIndex) {
    const baggage = await this.getBaggageByBooking(bookingId);
    
    if (itemIndex < 0 || itemIndex >= baggage.baggageItems.length) {
      throw new Error('Invalid baggage item index');
    }

    baggage.baggageItems.splice(itemIndex, 1);
    
    const baggageEntity = new BaggageManagement({
      bookingId: baggage.booking,
      userId: baggage.user,
      flightId: baggage.flight,
      tier: baggage.tier,
      baggageItems: baggage.baggageItems,
      allowedWeight: baggage.allowedWeight
    });

    baggage.totalWeight = baggageEntity.calculateTotalWeight();
    
    const flight = await FlightModel.findById(baggage.flight);
    const routeType = this.determineRouteType(flight);
    const feeCalculation = baggageEntity.calculateExcessFee(baggage.totalWeight, routeType);
    baggage.excessWeight = feeCalculation.excessWeight;
    baggage.totalFee = feeCalculation.fee;

    await baggage.save();
    return this.getBaggageByBooking(bookingId);
  }

  async calculateBaggageFee(bookingId) {
    const baggage = await this.getOrCreateBaggageManagement(bookingId);
    const flight = await FlightModel.findById(baggage.flight);
    
    const baggageEntity = new BaggageManagement({
      bookingId: baggage.booking,
      userId: baggage.user,
      flightId: baggage.flight,
      tier: baggage.tier,
      baggageItems: baggage.baggageItems,
      allowedWeight: baggage.allowedWeight
    });

    const routeType = this.determineRouteType(flight);
    const feeCalculation = baggageEntity.calculateExcessFee(baggage.totalWeight, routeType);
    
    const tierBenefits = baggageEntity.applyTierBenefits();
    const waivedAmount = feeCalculation.fee * tierBenefits.feeWaiver;
    const finalFee = feeCalculation.fee - waivedAmount;

    return {
      totalWeight: baggage.totalWeight,
      allowedWeight: baggage.allowedWeight,
      excessWeight: feeCalculation.excessWeight,
      baseFee: feeCalculation.fee,
      tierWaiver: waivedAmount,
      finalFee,
      tier: baggage.tier
    };
  }

  async updateBaggageFeeStatus(bookingId, status) {
    const baggage = await this.getBaggageByBooking(bookingId);
    
    if (!['pending', 'paid', 'waived'].includes(status)) {
      throw new Error('Invalid fee status');
    }

    baggage.feeStatus = status;
    await baggage.save();
    return this.getBaggageByBooking(bookingId);
  }

  async checkBaggageRestrictions(bookingId) {
    const baggage = await this.getBaggageByBooking(bookingId);
    
    const baggageEntity = new BaggageManagement({
      bookingId: baggage.booking,
      userId: baggage.user,
      flightId: baggage.flight,
      tier: baggage.tier,
      baggageItems: baggage.baggageItems,
      allowedWeight: baggage.allowedWeight
    });

    const violations = baggageEntity.checkRestrictions(baggage.baggageItems);
    baggage.restrictions = violations;
    await baggage.save();
    
    return {
      hasViolations: violations.length > 0,
      violations
    };
  }

  async getUserBaggage(userId) {
    return BaggageManagementModel.find({ user: userId })
      .populate('booking')
      .populate('flight')
      .sort({ createdAt: -1 });
  }

  async getAllBaggageRecords() {
    return BaggageManagementModel.find()
      .populate('booking')
      .populate('user', 'name email')
      .populate('flight')
      .sort({ createdAt: -1 });
  }

  async getBaggageById(id) {
    const baggage = await BaggageManagementModel.findById(id)
      .populate('booking')
      .populate('user', 'name email')
      .populate('flight');
    if (!baggage) throw new Error('Baggage record not found');
    return baggage;
  }
}

module.exports = new BaggageManagementService();
