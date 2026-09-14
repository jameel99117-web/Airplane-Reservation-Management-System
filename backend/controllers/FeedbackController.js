const FeedbackService = require('../services/FeedbackService');

class FeedbackController {
  constructor(service = FeedbackService) {
    this.#service = service;
  }

  #service;

  createFeedback = async (req, res) => {
    try {
      const { bookingId, rating, comment } = req.body;
      if (!bookingId || !rating) {
        return res.status(400).json({ success: false, message: 'bookingId and rating are required' });
      }

      const feedback = await this.#service.createFeedback({
        userId: req.user._id,
        bookingId,
        rating,
        comment: comment || ''
      });

      res.status(201).json({ success: true, message: 'Feedback submitted', data: feedback });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  };

  getUserFeedback = async (req, res) => {
    try {
      const feedback = await this.#service.getUserFeedback(req.user._id);
      res.json({ success: true, count: feedback.length, data: feedback });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  getAllFeedback = async (req, res) => {
    try {
      const feedback = await this.#service.getAllFeedback();
      res.json({ success: true, count: feedback.length, data: feedback });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  getFeedbackById = async (req, res) => {
    try {
      const feedback = await this.#service.getFeedbackById(req.params.id);
      res.json({ success: true, data: feedback });
    } catch (error) {
      res.status(404).json({ success: false, message: error.message });
    }
  };
}

module.exports = new FeedbackController();
