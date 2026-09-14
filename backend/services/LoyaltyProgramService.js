const LoyaltyProgramModel = require('../models/LoyaltyProgram');
const LoyaltyProgram = require('../classes/LoyaltyProgram');

class LoyaltyProgramService {
  async getOrCreateLoyaltyProgram(userId) {
    let program = await LoyaltyProgramModel.findOne({ user: userId });
    if (!program) {
      program = await LoyaltyProgramModel.create({ user: userId });
    }
    return program;
  }

  async getUserLoyaltyProgram(userId) {
    const program = await LoyaltyProgramModel.findOne({ user: userId })
      .populate('user', 'name email');
    if (!program) throw new Error('Loyalty program not found for user');
    return program;
  }

  async addPoints(userId, amount, flightCount = 1, referenceId = null, referenceType = 'booking') {
    const program = await this.getOrCreateLoyaltyProgram(userId);
    const loyaltyEntity = new LoyaltyProgram({
      userId: program.user,
      points: program.points,
      tier: program.tier,
      totalFlights: program.totalFlights,
      totalSpent: program.totalSpent,
      pointsEarned: program.pointsEarned,
      pointsRedeemed: program.pointsRedeemed
    });

    const pointsEarned = loyaltyEntity.calculatePointsEarned(amount, flightCount);
    
    program.points += pointsEarned;
    program.pointsEarned += pointsEarned;
    program.totalSpent += amount;
    program.totalFlights += flightCount;
    program.lastActivityDate = new Date();

    program.rewardsHistory.push({
      type: 'points_earned',
      points: pointsEarned,
      description: `Earned ${pointsEarned} points from ${referenceType}`,
      referenceId,
      referenceType
    });

    await this.checkAndUpgradeTier(program);
    await program.save();

    return this.getUserLoyaltyProgram(userId);
  }

  async redeemPoints(userId, pointsToRedeem, description = 'Points redemption') {
    const program = await this.getOrCreateLoyaltyProgram(userId);
    const loyaltyEntity = new LoyaltyProgram({
      userId: program.user,
      points: program.points,
      tier: program.tier,
      totalFlights: program.totalFlights,
      totalSpent: program.totalSpent,
      pointsEarned: program.pointsEarned,
      pointsRedeemed: program.pointsRedeemed
    });

    if (!loyaltyEntity.canRedeemPoints(pointsToRedeem)) {
      throw new Error('Insufficient points for redemption');
    }

    program.points -= pointsToRedeem;
    program.pointsRedeemed += pointsToRedeem;
    program.lastActivityDate = new Date();

    program.rewardsHistory.push({
      type: 'points_redeemed',
      points: pointsToRedeem,
      description,
      referenceId: null,
      referenceType: 'redemption'
    });

    await program.save();
    return this.getUserLoyaltyProgram(userId);
  }

  async checkAndUpgradeTier(program) {
    const loyaltyEntity = new LoyaltyProgram({
      userId: program.user,
      points: program.points,
      tier: program.tier,
      totalFlights: program.totalFlights,
      totalSpent: program.totalSpent,
      pointsEarned: program.pointsEarned,
      pointsRedeemed: program.pointsRedeemed
    });

    const eligibleTier = loyaltyEntity.checkTierEligibility();
    
    if (eligibleTier !== program.tier && eligibleTier !== 'silver') {
      const previousTier = program.tier;
      program.tier = eligibleTier;
      program.tierUpgradeDate = new Date();

      program.rewardsHistory.push({
        type: 'tier_upgrade',
        points: 0,
        description: `Upgraded from ${previousTier} to ${eligibleTier}`,
        referenceId: null,
        referenceType: 'tier_upgrade'
      });
    }

    return program;
  }

  async getTierBenefits(userId) {
    const program = await this.getUserLoyaltyProgram(userId);
    const loyaltyEntity = new LoyaltyProgram({
      userId: program.user,
      points: program.points,
      tier: program.tier,
      totalFlights: program.totalFlights,
      totalSpent: program.totalSpent,
      pointsEarned: program.pointsEarned,
      pointsRedeemed: program.pointsRedeemed
    });

    return loyaltyEntity.calculateTierBenefits();
  }

  async getRedemptionValue(userId, points) {
    const program = await this.getOrCreateLoyaltyProgram(userId);
    const loyaltyEntity = new LoyaltyProgram({
      userId: program.user,
      points: program.points,
      tier: program.tier,
      totalFlights: program.totalFlights,
      totalSpent: program.totalSpent,
      pointsEarned: program.pointsEarned,
      pointsRedeemed: program.pointsRedeemed
    });

    if (!loyaltyEntity.canRedeemPoints(points)) {
      throw new Error('Insufficient points for redemption');
    }

    return loyaltyEntity.getRedemptionValue(points);
  }

  async getAllLoyaltyPrograms() {
    return LoyaltyProgramModel.find()
      .populate('user', 'name email')
      .sort({ points: -1 });
  }

  async getLoyaltyProgramById(id) {
    const program = await LoyaltyProgramModel.findById(id)
      .populate('user', 'name email');
    if (!program) throw new Error('Loyalty program not found');
    return program;
  }

  async getRewardsHistory(userId) {
    const program = await this.getOrCreateLoyaltyProgram(userId);
    if (!program.rewardsHistory || program.rewardsHistory.length === 0) {
      return [];
    }
    
    // Sort safely with proper date handling
    return program.rewardsHistory.slice().sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
  }
}

module.exports = new LoyaltyProgramService();
