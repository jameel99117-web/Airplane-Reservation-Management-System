class LoyaltyProgram {
  constructor(data) {
    this.userId = data.userId;
    this.points = data.points || 0;
    this.tier = data.tier || 'silver';
    this.totalFlights = data.totalFlights || 0;
    this.totalSpent = data.totalSpent || 0;
    this.pointsEarned = data.pointsEarned || 0;
    this.pointsRedeemed = data.pointsRedeemed || 0;
  }

  static TIER_THRESHOLDS = {
    silver: { minPoints: 0, minFlights: 0, pointsMultiplier: 1 },
    gold: { minPoints: 5000, minFlights: 10, pointsMultiplier: 1.25 },
    platinum: { minPoints: 15000, minFlights: 30, pointsMultiplier: 1.5 }
  };

  static POINTS_PER_DOLLAR = 10;
  static POINTS_PER_FLIGHT = 100;

  calculatePointsEarned(amount, flightCount = 1) {
    const basePoints = (amount * LoyaltyProgram.POINTS_PER_DOLLAR) + (flightCount * LoyaltyProgram.POINTS_PER_FLIGHT);
    const multiplier = LoyaltyProgram.TIER_THRESHOLDS[this.tier].pointsMultiplier;
    return Math.floor(basePoints * multiplier);
  }

  calculateTierBenefits() {
    const tierInfo = LoyaltyProgram.TIER_THRESHOLDS[this.tier];
    return {
      tier: this.tier,
      pointsMultiplier: tierInfo.pointsMultiplier,
      baggageAllowance: this.tier === 'silver' ? 20 : this.tier === 'gold' ? 30 : 40,
      priorityCheckIn: this.tier !== 'silver',
      loungeAccess: this.tier === 'platinum',
      freeSeatSelection: this.tier !== 'silver'
    };
  }

  checkTierEligibility() {
    if (this.points >= LoyaltyProgram.TIER_THRESHOLDS.platinum.minPoints && 
        this.totalFlights >= LoyaltyProgram.TIER_THRESHOLDS.platinum.minFlights) {
      return 'platinum';
    }
    if (this.points >= LoyaltyProgram.TIER_THRESHOLDS.gold.minPoints && 
        this.totalFlights >= LoyaltyProgram.TIER_THRESHOLDS.gold.minFlights) {
      return 'gold';
    }
    return 'silver';
  }

  canRedeemPoints(pointsToRedeem) {
    return this.points >= pointsToRedeem;
  }

  getRedemptionValue(points) {
    return points / 100;
  }

  toObject() {
    return {
      userId: this.userId,
      points: this.points,
      tier: this.tier,
      totalFlights: this.totalFlights,
      totalSpent: this.totalSpent,
      pointsEarned: this.pointsEarned,
      pointsRedeemed: this.pointsRedeemed
    };
  }
}

module.exports = LoyaltyProgram;
