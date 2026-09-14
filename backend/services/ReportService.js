const BookingModel = require('../models/Booking');
const FlightModel = require('../models/Flight');
const UserModel = require('../models/User');

class ReportService {
  async getOverview() {
    const [totalBookings, confirmed, cancelled, pending, flights, users, revenue] = await Promise.all([
      BookingModel.countDocuments(),
      BookingModel.countDocuments({ status: 'confirmed' }),
      BookingModel.countDocuments({ status: 'cancelled' }),
      BookingModel.countDocuments({ status: 'pending_payment' }),
      FlightModel.countDocuments(),
      UserModel.countDocuments(),
      BookingModel.aggregate([
        { $match: { paymentStatus: 'success' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ])
    ]);

    const paymentStats = await BookingModel.aggregate([
      { $group: { _id: '$paymentStatus', count: { $sum: 1 } } }
    ]);

    return {
      totalBookings,
      confirmedBookings: confirmed,
      cancelledBookings: cancelled,
      pendingPaymentBookings: pending,
      totalFlights: flights,
      totalUsers: users,
      totalRevenue: revenue[0]?.total || 0,
      paymentBreakdown: paymentStats.reduce((acc, p) => {
        acc[p._id] = p.count;
        return acc;
      }, {})
    };
  }

  async getSeatOccupancy() {
    const flights = await FlightModel.find().sort({ departureDate: 1 });
    return flights.map((f) => {
      const booked = f.seats.filter((s) => s.isBooked).length;
      const total = f.totalSeats;
      const occupancyRate = total > 0 ? Math.round((booked / total) * 100) : 0;
      return {
        flightId: f._id,
        flightNumber: f.flightNumber,
        route: `${f.source} → ${f.destination}`,
        departureDate: f.departureDate,
        bookedSeats: booked,
        totalSeats: total,
        availableSeats: total - booked,
        occupancyRate
      };
    });
  }

  async getPerformanceReport() {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentBookings = await BookingModel.find({ createdAt: { $gte: sevenDaysAgo } });
    const successPayments = recentBookings.filter((b) => b.paymentStatus === 'success').length;
    const failedPayments = recentBookings.filter((b) => b.paymentStatus === 'failed').length;

    const flights = await FlightModel.find();
    let totalSeats = 0;
    let bookedSeats = 0;
    flights.forEach((f) => {
      totalSeats += f.totalSeats;
      bookedSeats += f.seats.filter((s) => s.isBooked).length;
    });

    const systemOccupancy = totalSeats > 0 ? Math.round((bookedSeats / totalSeats) * 100) : 0;
    const paymentSuccessRate =
      recentBookings.length > 0 ? Math.round((successPayments / recentBookings.length) * 100) : 0;

    return {
      period: 'Last 7 days',
      bookingsCreated: recentBookings.length,
      paymentSuccessRate,
      successfulPayments: successPayments,
      failedPayments,
      systemWideOccupancy: systemOccupancy,
      totalSeats,
      bookedSeats,
      generatedAt: new Date()
    };
  }
}

module.exports = new ReportService();
