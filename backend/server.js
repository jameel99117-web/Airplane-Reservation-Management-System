require('dotenv').config();
const path = require('path');
const express = require('express');
const app = require('./app');
const database = require('./config/database');
const SetupService = require('./services/SetupService');

// Local-dev-only: serve the frontend, since app.js no longer does this
// (Vercel's @vercel/static handles it in production instead).
app.use(express.static(path.join(__dirname, '../frontend')));

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