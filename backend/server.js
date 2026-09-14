require('dotenv').config();
const app = require('./app');
const database = require('./config/database');
const SetupService = require('./services/SetupService');

const PORT = process.env.PORT || 3000;

async function start() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/airline_reservation';
  await database.connect(uri);
  await SetupService.initializeApplication();
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err.message);
  process.exit(1);
});