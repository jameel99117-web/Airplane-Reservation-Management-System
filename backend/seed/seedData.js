require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const UserModel = require('../models/User');
const FlightModel = require('../models/Flight');
const BookingModel = require('../models/Booking');
const { buildFlights } = require('./ensureData');
const bcrypt = require('bcryptjs');

async function seed() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/airline_reservation';
  await mongoose.connect(uri);
  console.log('Connected for seeding:', mongoose.connection.name);

  await Promise.all([
    UserModel.deleteMany({}),
    FlightModel.deleteMany({}),
    BookingModel.deleteMany({})
  ]);

  const adminPassword = await bcrypt.hash('admin123', 10);
  const userPassword = await bcrypt.hash('user123', 10);

  const admin = await UserModel.create({
    name: 'System Admin',
    email: 'admin@airline.com',
    password: adminPassword,
    role: 'admin'
  });

  const user = await UserModel.create({
    name: 'John Doe',
    email: 'john@example.com',
    password: userPassword,
    role: 'user'
  });

  const flights = await FlightModel.insertMany(buildFlights());
  flights[0].seats[0].isBooked = true;
  await flights[0].save();

  await BookingModel.create({
    user: user._id,
    flight: flights[0]._id,
    seatNumbers: ['1A'],
    passengerName: 'John Doe',
    passengerEmail: 'john@example.com',
    totalAmount: flights[0].price,
    bookingReference: 'BK-SEED-001',
    status: 'confirmed'
  });

  console.log('\n--- Seed completed ---');
  console.log('Admin: admin@airline.com / admin123');
  console.log('User:  john@example.com / user123');
  console.log(`Flights: ${flights.length}\n`);

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
