const FlightModel = require('../models/Flight');
const Flight = require('../classes/Flight');
const PricingRuleService = require('./PricingRuleService');

class FlightService {
  #buildDateRange(dateString) {
    if (!dateString) return null;
    const parts = String(dateString).split('-').map(Number);
    if (parts.length !== 3) return null;
    const [year, month, day] = parts;
    return {
      start: new Date(year, month - 1, day, 0, 0, 0, 0),
      end: new Date(year, month - 1, day, 23, 59, 59, 999)
    };
  }

  #buildQuery(filters) {
    const query = {};
    if (filters.source) {
      query.source = new RegExp(filters.source, 'i');
    }
    if (filters.destination) {
      query.destination = new RegExp(filters.destination, 'i');
    }
    const dateRange = this.#buildDateRange(filters.date);
    if (dateRange) {
      query.departureDate = { $gte: dateRange.start, $lte: dateRange.end };
    }
    return query;
  }

  async #applyPricing(flight) {
    flight.adjustedPrice = await PricingRuleService.applyPricingRules(flight.price, flight);
    return flight;
  }

  async getAllFlights(filters = {}) {
    const query = this.#buildQuery(filters);
    const docs = await FlightModel.find(query).sort({ departureDate: 1 });
    const flights = docs.map((doc) => Flight.fromDocument(doc).toObject());
    
    return Promise.all(flights.map(f => this.#applyPricing(f)));
  }

  async getFlightById(id) {
    const doc = await FlightModel.findById(id);
    if (!doc) throw new Error('Flight not found');
    const flight = Flight.fromDocument(doc).toObject();
    return this.#applyPricing(flight);
  }

  async createFlight(data) {
    const seats = Flight.generateSeats(data.totalSeats);
    const doc = await FlightModel.create({ ...data, seats });
    return Flight.fromDocument(doc).toObject();
  }

  async updateFlight(id, data) {
    const flight = await FlightModel.findById(id);
    if (!flight) throw new Error('Flight not found');

    const updatable = [
      'flightNumber',
      'airline',
      'source',
      'destination',
      'departureDate',
      'departureTime',
      'arrivalTime',
      'price'
    ];
    updatable.forEach((key) => {
      if (data[key] !== undefined) flight[key] = data[key];
    });

    if (data.totalSeats !== undefined && data.totalSeats !== flight.totalSeats) {
      const booked = flight.seats.filter((s) => s.isBooked);
      if (data.totalSeats < booked.length) {
        throw new Error('Cannot reduce seats below already booked count');
      }
      const newSeats = Flight.generateSeats(data.totalSeats);
      booked.forEach((b) => {
        const seat = newSeats.find((s) => s.seatNumber === b.seatNumber);
        if (seat) seat.isBooked = true;
      });
      flight.seats = newSeats;
      flight.totalSeats = data.totalSeats;
    }

    await flight.save();
    return Flight.fromDocument(flight).toObject();
  }

  async deleteFlight(id) {
    const doc = await FlightModel.findByIdAndDelete(id);
    if (!doc) throw new Error('Flight not found');
    return { message: 'Flight deleted successfully' };
  }
}

module.exports = new FlightService();
