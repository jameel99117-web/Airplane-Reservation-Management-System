class BaggageManagement {
  constructor(data) {
    this.bookingId = data.bookingId;
    this.userId = data.userId;
    this.flightId = data.flightId;
    this.tier = data.tier || 'silver';
    this.baggageItems = data.baggageItems || [];
    this.allowedWeight = data.allowedWeight || 20;
  }

  static TIER_ALLOWANCES = {
    silver: { carryOn: 7, checked: 20, special: 0 },
    gold: { carryOn: 7, checked: 30, special: 1 },
    platinum: { carryOn: 10, checked: 40, special: 2 }
  };

  static ROUTE_ALLOWANCES = {
    domestic: { baseWeight: 20, excessFeePerKg: 15 },
    international: { baseWeight: 23, excessFeePerKg: 20 },
    longHaul: { baseWeight: 30, excessFeePerKg: 25 }
  };

  static RESTRICTIONS = {
    carryOn: {
      maxWeight: 10,
      maxDimensions: { length: 56, width: 36, height: 23 },
      prohibitedItems: ['liquids_gt_100ml', 'weapons', 'explosives']
    },
    checked: {
      maxWeight: 32,
      maxDimensions: { length: 158, sumOfDimensions: 300 },
      prohibitedItems: ['batteries', 'flammables', 'perishables']
    },
    special: {
      types: ['sports_equipment', 'musical_instrument', 'medical_equipment', 'pet'],
      requiresApproval: true
    }
  };

  calculateAllowedWeight(routeType = 'domestic') {
    const tierAllowance = BaggageManagement.TIER_ALLOWANCES[this.tier].checked;
    const routeAllowance = BaggageManagement.ROUTE_ALLOWANCES[routeType].baseWeight;
    return Math.max(tierAllowance, routeAllowance);
  }

  calculateExcessFee(totalWeight, routeType = 'domestic') {
    const allowedWeight = this.calculateAllowedWeight(routeType);
    const excessWeight = Math.max(0, totalWeight - allowedWeight);
    const feePerKg = BaggageManagement.ROUTE_ALLOWANCES[routeType].excessFeePerKg;
    return {
      excessWeight,
      fee: excessWeight * feePerKg
    };
  }

  validateBaggageItem(item) {
    const restrictions = BaggageManagement.RESTRICTIONS[item.type];
    if (!restrictions) return { valid: false, error: 'Invalid baggage type' };

    if (item.weight > restrictions.maxWeight) {
      return { valid: false, error: `Weight exceeds maximum of ${restrictions.maxWeight}kg` };
    }

    if (item.type === 'special' && !BaggageManagement.RESTRICTIONS.special.types.includes(item.description)) {
      return { valid: false, error: 'Special item type not recognized' };
    }

    return { valid: true };
  }

  checkRestrictions(baggageItems) {
    const violations = [];
    
    baggageItems.forEach(item => {
      const validation = this.validateBaggageItem(item);
      if (!validation.valid) {
        violations.push({
          type: item.type,
          error: validation.error,
          isViolated: true
        });
      }
    });

    return violations;
  }

  calculateTotalWeight() {
    return this.baggageItems.reduce((total, item) => total + item.weight, 0);
  }

  applyTierBenefits() {
    const benefits = BaggageManagement.TIER_ALLOWANCES[this.tier];
    return {
      tier: this.tier,
      carryOnAllowance: benefits.carryOn,
      checkedAllowance: benefits.checked,
      specialAllowance: benefits.special,
      feeWaiver: this.tier === 'platinum' ? 0.5 : this.tier === 'gold' ? 0.25 : 0
    };
  }

  toObject() {
    return {
      bookingId: this.bookingId,
      userId: this.userId,
      flightId: this.flightId,
      tier: this.tier,
      baggageItems: this.baggageItems,
      allowedWeight: this.allowedWeight
    };
  }
}

module.exports = BaggageManagement;
