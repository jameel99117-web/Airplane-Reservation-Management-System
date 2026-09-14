const BoardingPassService = require('../services/BoardingPassService');

class BoardingPassController {
  constructor(service = BoardingPassService) {
    this.#service = service;
  }

  #service;

  generateBoardingPass = async (req, res) => {
    try {
      const { bookingId } = req.params;
      if (!bookingId) {
        return res.status(400).json({ success: false, message: 'Booking ID is required' });
      }

      const boardingPass = await this.#service.generateBoardingPass(bookingId, req.user._id);
      res.json({ success: true, data: boardingPass });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  };

  getUserBoardingPasses = async (req, res) => {
    try {
      const boardingPasses = await this.#service.getUserBoardingPasses(req.user._id);
      res.json({ success: true, count: boardingPasses.length, data: boardingPasses });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
}

module.exports = new BoardingPassController();
