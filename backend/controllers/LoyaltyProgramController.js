const LoyaltyProgramService = require('../services/LoyaltyProgramService');

class LoyaltyProgramController {
  constructor(service = LoyaltyProgramService) {
    this.#service = service;
  }

  #service;

  #handleError(res, error, statusCode = 400) {
    res.status(statusCode).json({ success: false, message: error.message });
  }

  getMyLoyaltyProgram = async (req, res) => {
    try {
      const program = await this.#service.getOrCreateLoyaltyProgram(req.user._id);
      res.json({ success: true, data: program });
    } catch (error) {
      this.#handleError(res, error, 404);
    }
  };

  getTierBenefits = async (req, res) => {
    try {
      const program = await this.#service.getOrCreateLoyaltyProgram(req.user._id);
      const loyaltyEntity = new (require('../classes/LoyaltyProgram'))({
        userId: program.user,
        points: program.points,
        tier: program.tier,
        totalFlights: program.totalFlights,
        totalSpent: program.totalSpent,
        pointsEarned: program.pointsEarned,
        pointsRedeemed: program.pointsRedeemed
      });
      const benefits = loyaltyEntity.calculateTierBenefits();
      res.json({ success: true, data: benefits });
    } catch (error) {
      this.#handleError(res, error, 404);
    }
  };

  redeemPoints = async (req, res) => {
    try {
      const { points, description } = req.body;
      if (!points || points <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Points must be a positive number'
        });
      }

      const program = await this.#service.redeemPoints(
        req.user._id,
        points,
        description || 'Points redemption'
      );
      res.json({
        success: true,
        message: 'Points redeemed successfully',
        data: program
      });
    } catch (error) {
      this.#handleError(res, error);
    }
  };

  getRedemptionValue = async (req, res) => {
    try {
      const { points } = req.params;
      const value = await this.#service.getRedemptionValue(req.user._id, parseInt(points));
      res.json({
        success: true,
        data: { points: parseInt(points), value }
      });
    } catch (error) {
      this.#handleError(res, error);
    }
  };

  getRewardsHistory = async (req, res) => {
    try {
      const LoyaltyProgramModel = require('../models/LoyaltyProgram');
      const program = await LoyaltyProgramModel.findOne({ user: req.user._id });
      
      if (!program || !program.rewardsHistory || program.rewardsHistory.length === 0) {
        return res.json({ success: true, count: 0, data: [] });
      }
      
      // Return unsorted history - let frontend handle sorting
      const history = program.rewardsHistory.map(item => ({
        type: item.type,
        points: item.points,
        description: item.description,
        referenceId: item.referenceId,
        referenceType: item.referenceType,
        createdAt: item.createdAt
      }));
      
      res.json({ success: true, count: history.length, data: history });
    } catch (error) {
      console.error('Error in getRewardsHistory:', error);
      this.#handleError(res, error, 404);
    }
  };

  getAllLoyaltyPrograms = async (req, res) => {
    try {
      const programs = await this.#service.getAllLoyaltyPrograms();
      res.json({ success: true, count: programs.length, data: programs });
    } catch (error) {
      this.#handleError(res, error, 500);
    }
  };

  getLoyaltyProgram = async (req, res) => {
    try {
      const program = await this.#service.getLoyaltyProgramById(req.params.id);
      res.json({ success: true, data: program });
    } catch (error) {
      this.#handleError(res, error, 404);
    }
  };

  addPoints = async (req, res) => {
    try {
      const { amount, flightCount, referenceId, referenceType } = req.body;
      if (!amount || amount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Amount must be a positive number'
        });
      }

      const program = await this.#service.addPoints(
        req.user._id,
        amount,
        flightCount || 1,
        referenceId,
        referenceType || 'booking'
      );
      res.json({
        success: true,
        message: 'Points added successfully',
        data: program
      });
    } catch (error) {
      this.#handleError(res, error);
    }
  };
}

module.exports = new LoyaltyProgramController();
