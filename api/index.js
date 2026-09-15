require('dotenv').config();
const app = require('../backend/app');
const database = require('../backend/config/database');
const SetupService = require('../backend/services/SetupService');

let initPromise;

function ensureInitialized() {
  if (!initPromise) {
    initPromise = (async () => {
      const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/airline_reservation';
      await database.connect(uri);
      await SetupService.initializeApplication();
    })().catch((err) => {
      // reset so the next request can retry instead of being stuck on a failed promise forever
      initPromise = null;
      throw err;
    });
  }
  return initPromise;
}

module.exports = async (req, res) => {
  await ensureInitialized();
  return app(req, res);
};