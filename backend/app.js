const express = require('express');
const cors = require('cors');
const healthRoutes = require('./routes/healthRoutes');
const setupRoutes = require('./routes/setupRoutes');
const userRoutes = require('./routes/userRoutes');
const flightRoutes = require('./routes/flightRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const reportRoutes = require('./routes/reportRoutes');
const systemRoutes = require('./routes/systemRoutes');
const refundRoutes = require('./routes/refundRoutes');
const pricingRoutes = require('./routes/pricingRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const supportRoutes = require('./routes/supportRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const emergencyContactRoutes = require('./routes/emergencyContactRoutes');
const boardingPassRoutes = require('./routes/boardingPassRoutes');
const assistanceRequestRoutes = require('./routes/assistanceRequestRoutes');
const mealPreferenceRoutes = require('./routes/mealPreferenceRoutes');
const loyaltyRoutes = require('./routes/loyaltyRoutes');
const baggageRoutes = require('./routes/baggageRoutes');
const promoCodeRoutes = require('./routes/promoCodeRoutes');

class Application {
  constructor() {
    this.#app = express();
    this.#configureMiddleware();
    this.#configureRoutes();
    this.#configureErrorHandler();
  }

  #app;

  #configureMiddleware() {
    this.#app.use(cors());
    this.#app.use(express.json());
    this.#app.use(express.urlencoded({ extended: true }));
    // Static frontend serving removed — Vercel's @vercel/static handles it
    // in production. Local dev serves it from server.js instead.
  }

  #configureRoutes() {
    this.#app.use('/api/health', healthRoutes);
    this.#app.use('/api/setup', setupRoutes);
    this.#app.use('/api/users', userRoutes);
    this.#app.use('/api/flights', flightRoutes);
    this.#app.use('/api/bookings', bookingRoutes);
    this.#app.use('/api/payments', paymentRoutes);
    this.#app.use('/api/reports', reportRoutes);
    this.#app.use('/api/system', systemRoutes);
    this.#app.use('/api/refunds', refundRoutes);
    this.#app.use('/api/pricing', pricingRoutes);
    this.#app.use('/api/analytics', analyticsRoutes);
    this.#app.use('/api/support', supportRoutes);
    this.#app.use('/api/tickets', ticketRoutes);
    this.#app.use('/api/notifications', notificationRoutes);
    this.#app.use('/api/feedback', feedbackRoutes);
    this.#app.use('/api/emergency-contacts', emergencyContactRoutes);
    this.#app.use('/api/boarding-passes', boardingPassRoutes);
    this.#app.use('/api/assistance-requests', assistanceRequestRoutes);
    this.#app.use('/api/meal-preferences', mealPreferenceRoutes);
    this.#app.use('/api/loyalty', loyaltyRoutes);
    this.#app.use('/api/baggage', baggageRoutes);
    this.#app.use('/api/promo-codes', promoCodeRoutes);
    this.#app.use((req, res) => {
      if (req.path.startsWith('/api')) {
        return res.status(404).json({ success: false, message: 'API route not found' });
      }
      res.status(404).send('Page not found');
    });
  }

  #configureErrorHandler() {
    this.#app.use((err, req, res, next) => {
      console.error(err.stack);
      res.status(500).json({ success: false, message: 'Internal server error' });
    });
  }

  getApp() {
    return this.#app;
  }
}

module.exports = new Application().getApp();