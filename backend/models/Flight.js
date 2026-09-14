const mongoose = require('mongoose');

const seatSchema = new mongoose.Schema(
  {
    seatNumber: { type: String, required: true },
    isBooked: { type: Boolean, default: false }
  },
  { _id: false }
);

const flightSchema = new mongoose.Schema(
  {
    flightNumber: { type: String, required: true, unique: true, trim: true },
    airline: { type: String, required: true, trim: true },
    source: { type: String, required: true, trim: true },
    destination: { type: String, required: true, trim: true },
    departureDate: { type: Date, required: true },
    departureTime: { type: String, required: true },
    arrivalTime: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    totalSeats: { type: Number, required: true, min: 1 },
    seats: [seatSchema]
  },
  { timestamps: true }
);

module.exports = mongoose.model('Flight', flightSchema);
