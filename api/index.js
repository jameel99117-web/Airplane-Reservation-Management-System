require('dotenv').config();
const serverless = require('serverless-http');
const app = require('../backend/app');
const database = require('../backend/config/database');
const SetupService = require('../backend/services/SetupService');

let handlerPromise;

function ensureInitialized() {
  if (!handlerPromise) {
    handlerPromise = (async () => {
      const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/airline_reservation';
      await database.connect(uri);
      await SetupService.initializeApplication();
      return serverless(app);
    })().catch((err) => {
      // reset so the next request can retry instead of being stuck on a failed promise forever
      handlerPromise = null;
      throw err;
    });
  }
  return handlerPromise;
}

module.exports = async (req, res) => {
  const h = await ensureInitialized();
  return h(req, res);
};