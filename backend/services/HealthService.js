const mongoose = require('mongoose');
const FlightModel = require('../models/Flight');

class HealthService {
  async getStatus() {
    const flightCount = await FlightModel.countDocuments();
    return {
      message: 'Airline Reservation API is running',
      database: mongoose.connection.name,
      flightCount
    };
  }
}

module.exports = new HealthService();
