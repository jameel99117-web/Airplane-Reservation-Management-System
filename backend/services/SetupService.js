const mongoose = require('mongoose');
const FlightModel = require('../models/Flight');
const UserModel = require('../models/User');
const { ensureFlights, ensureUsers, ensureSampleData } = require('../seed/ensureData');

class SetupService {
  async getStatus() {
    const [flightCount, userCount] = await Promise.all([
      FlightModel.countDocuments(),
      UserModel.countDocuments()
    ]);
    return {
      database: mongoose.connection.name,
      flightCount,
      userCount,
      ready: flightCount > 0
    };
  }

  async seedFlights(force = false) {
    await ensureUsers();
    return ensureFlights(force);
  }

  async initializeApplication() {
    return ensureSampleData();
  }
}

module.exports = new SetupService();
