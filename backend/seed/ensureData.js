const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const UserModel = require('../models/User');
const FlightModel = require('../models/Flight');
const BookingModel = require('../models/Booking');
const Flight = require('../classes/Flight');
const { ROLES } = require('../config/roles');

function addDays(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(12, 0, 0, 0);
  return d;
}

function buildFlights() {
  return [
    { flightNumber: 'SW101', airline: 'SkyWings', source: 'New York', destination: 'Los Angeles', departureDate: addDays(0), departureTime: '08:00', arrivalTime: '11:30', price: 299, totalSeats: 30 },
    { flightNumber: 'SW102', airline: 'SkyWings', source: 'New York', destination: 'Los Angeles', departureDate: addDays(1), departureTime: '14:00', arrivalTime: '17:30', price: 279, totalSeats: 30 },
    { flightNumber: 'SW201', airline: 'SkyWings', source: 'Chicago', destination: 'Miami', departureDate: addDays(0), departureTime: '09:00', arrivalTime: '12:45', price: 189, totalSeats: 24 },
    { flightNumber: 'SW202', airline: 'SkyWings', source: 'Chicago', destination: 'Miami', departureDate: addDays(3), departureTime: '16:00', arrivalTime: '19:45', price: 199, totalSeats: 24 },
    { flightNumber: 'GA301', airline: 'Global Air', source: 'San Francisco', destination: 'Seattle', departureDate: addDays(1), departureTime: '07:30', arrivalTime: '09:30', price: 149, totalSeats: 18 },
    { flightNumber: 'GA302', airline: 'Global Air', source: 'San Francisco', destination: 'Seattle', departureDate: addDays(7), departureTime: '11:00', arrivalTime: '13:00', price: 159, totalSeats: 18 },
    { flightNumber: 'GA401', airline: 'Global Air', source: 'Boston', destination: 'Denver', departureDate: addDays(2), departureTime: '10:00', arrivalTime: '13:30', price: 259, totalSeats: 36 },
    { flightNumber: 'GA402', airline: 'Global Air', source: 'Boston', destination: 'Denver', departureDate: addDays(5), departureTime: '18:00', arrivalTime: '21:30', price: 249, totalSeats: 36 },
    { flightNumber: 'PA501', airline: 'Pacific Air', source: 'Dallas', destination: 'Houston', departureDate: addDays(0), departureTime: '06:30', arrivalTime: '07:45', price: 99, totalSeats: 20 },
    { flightNumber: 'PA502', airline: 'Pacific Air', source: 'Dallas', destination: 'Houston', departureDate: addDays(4), departureTime: '15:00', arrivalTime: '16:15', price: 109, totalSeats: 20 },
    { flightNumber: 'EA601', airline: 'Eastern Express', source: 'Atlanta', destination: 'Orlando', departureDate: addDays(1), departureTime: '12:00', arrivalTime: '13:20', price: 129, totalSeats: 28 },
    { flightNumber: 'EA602', airline: 'Eastern Express', source: 'Atlanta', destination: 'Orlando', departureDate: addDays(10), departureTime: '17:00', arrivalTime: '18:20', price: 139, totalSeats: 28 }
  ].map((f) => ({ ...f, seats: Flight.generateSeats(f.totalSeats) }));
}

async function ensureUsers() {
  const accounts = [
    { name: 'John Doe', email: 'john@example.com', password: 'user123', role: ROLES.PASSENGER },
    { name: 'Airline Admin', email: 'admin@airline.com', password: 'admin123', role: ROLES.ADMIN },
    { name: 'Reservation Agent', email: 'agent@airline.com', password: 'agent123', role: ROLES.AGENT },
    { name: 'Operations Manager', email: 'manager@airline.com', password: 'manager123', role: ROLES.MANAGER }
  ];
  for (const acc of accounts) {
    const exists = await UserModel.findOne({ email: acc.email });
    if (!exists) {
      await UserModel.create({
        name: acc.name,
        email: acc.email,
        password: await bcrypt.hash(acc.password, 10),
        role: acc.role
      });
      console.log(`Created user: ${acc.email} (${acc.role})`);
    }
  }
}

async function ensureFlights(force = false) {
  const flightCount = await FlightModel.countDocuments();
  if (flightCount > 0 && !force) {
    return { seeded: false, flightCount, message: 'Flights already exist' };
  }

  if (force && flightCount > 0) {
    await BookingModel.deleteMany({});
    await FlightModel.deleteMany({});
    console.log('Cleared existing flights for re-seed');
  }

  const flights = await FlightModel.insertMany(buildFlights());
  console.log(`Inserted ${flights.length} flights into database "${mongoose.connection.name}"`);
  return { seeded: true, flightCount: flights.length, database: mongoose.connection.name };
}

async function ensureSampleData() {
  await ensureUsers();
  const result = await ensureFlights(false);

  if (result.seeded) {
    const passenger = await UserModel.findOne({ email: 'john@example.com' });
    if (passenger) {
      const flights = await FlightModel.find().limit(1);
      if (flights[0]) {
        const exists = await BookingModel.findOne({ bookingReference: 'BK-SEED-001' });
        if (!exists) {
          flights[0].seats[0].isBooked = true;
          await flights[0].save();
          await BookingModel.create({
            user: passenger._id,
            flight: flights[0]._id,
            seatNumbers: ['1A'],
            passengerName: 'John Doe',
            passengerEmail: 'john@example.com',
            totalAmount: flights[0].price,
            bookingReference: 'BK-SEED-001',
            status: 'confirmed',
            paymentStatus: 'success',
            paymentTransactionId: 'PAY-SEED-DEMO',
            paymentMethod: 'card'
          });
        }
      }
    }
    console.log('Demo accounts seeded (see README)');
  } else {
    console.log(`Database "${mongoose.connection.name}" has ${result.flightCount} flight(s)`);
  }

  return result;
}

module.exports = { ensureSampleData, ensureFlights, buildFlights, ensureUsers };
