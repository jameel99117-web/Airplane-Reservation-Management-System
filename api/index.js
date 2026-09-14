require('dotenv').config();
const serverless = require('serverless-http');
const app = require('../backend/app');
const database = require('../backend/config/database');
const SetupService = require('../backend/services/SetupService');

let handler;
let initialized = false;

async function ensureInitialized() {
  if (!initialized) {
    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/airline_reservation';
    await database.connect(uri);
    await SetupService.initializeApplication();
    handler = serverless(app);
    initialized = true;
  }
  return handler;
}

module.exports = async (req, res) => {
  const h = await ensureInitialized();
  return h(req, res);
};