const BookingModel = require('../models/Booking');
const FlightModel = require('../models/Flight');
const RefundModel = require('../models/Refund');

class AnalyticsService {
  async getRoutePerformance(sortOrder = 'desc') {
    const sortDirection = sortOrder === 'asc' ? 1 : -1;
    
    const routeStats = await BookingModel.aggregate([
      {
        $match: {
          status: { $in: ['confirmed', 'pending_payment'] },
          paymentStatus: 'success'
        }
      },
      {
        $lookup: {
          from: 'flights',
          localField: 'flight',
          foreignField: '_id',
          as: 'flight'
        }
      },
      {
        $unwind: '$flight'
      },
      {
        $group: {
          _id: {
            source: '$flight.source',
            destination: '$flight.destination'
          },
          totalBookings: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' }
        }
      },
      {
        $project: {
          _id: 0,
          route: '$_id.source → $_id.destination',
          source: '$_id.source',
          destination: '$_id.destination',
          totalBookings: 1,
          totalRevenue: 1
        }
      },
      {
        $sort: { totalBookings: sortDirection }
      }
    ]);

    return routeStats;
  }

  async getFlightPerformanceRanking() {
    const flightStats = await BookingModel.aggregate([
      {
        $match: {
          status: { $in: ['confirmed', 'pending_payment'] }
        }
      },
      {
        $lookup: {
          from: 'flights',
          localField: 'flight',
          foreignField: '_id',
          as: 'flight'
        }
      },
      {
        $unwind: '$flight'
      },
      {
        $group: {
          _id: '$flight',
          flightNumber: { $first: '$flight.flightNumber' },
          source: { $first: '$flight.source' },
          destination: { $first: '$flight.destination' },
          totalSeats: { $first: '$flight.totalSeats' },
          totalBookings: { $sum: 1 },
          totalRevenue: {
            $sum: {
              $cond: [{ $eq: ['$paymentStatus', 'success'] }, '$totalAmount', 0]
            }
          },
          paidBookings: {
            $sum: {
              $cond: [{ $eq: ['$paymentStatus', 'success'] }, 1, 0]
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          flightId: '$_id',
          flightNumber: 1,
          route: '$source → $destination',
          totalBookings: 1,
          totalRevenue: 1,
          occupancyRate: {
            $multiply: [
              { $divide: ['$paidBookings', '$totalSeats'] },
              100
            ]
          }
        }
      },
      {
        $sort: { totalRevenue: -1 }
      }
    ]);

    return flightStats.map((flight, index) => ({
      ...flight,
      rank: index + 1
    }));
  }

  async getPaymentsAndRefunds(filters = {}) {
    const matchConditions = {};
    
    if (filters.status) {
      matchConditions.paymentStatus = filters.status;
    }

    const bookings = await BookingModel.aggregate([
      {
        $match: matchConditions
      },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: { path: '$user', preserveNullAndEmptyArrays: true }
      },
      {
        $project: {
          _id: 0,
          bookingId: '$_id',
          bookingReference: '$bookingReference',
          passengerName: '$passengerName',
          userEmail: '$user.email',
          amount: '$totalAmount',
          status: '$paymentStatus',
          bookingStatus: '$status',
          type: 'payment',
          createdAt: '$createdAt'
        }
      }
    ]);

    const refundMatchConditions = {};
    if (filters.status) {
      const statusMap = {
        'pending': 'pending',
        'success': 'approved',
        'failed': 'rejected'
      };
      refundMatchConditions.status = statusMap[filters.status];
    }

    const refunds = await RefundModel.aggregate([
      {
        $match: refundMatchConditions
      },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: { path: '$user', preserveNullAndEmptyArrays: true }
      },
      {
        $lookup: {
          from: 'bookings',
          localField: 'booking',
          foreignField: '_id',
          as: 'booking'
        }
      },
      {
        $unwind: { path: '$booking', preserveNullAndEmptyArrays: true }
      },
      {
        $project: {
          _id: 0,
          bookingId: '$booking._id',
          bookingReference: '$booking.bookingReference',
          passengerName: '$user.name',
          userEmail: '$user.email',
          amount: '$amount',
          status: '$status',
          bookingStatus: '$booking.status',
          type: 'refund',
          createdAt: '$createdAt'
        }
      }
    ]);

    const allTransactions = [...bookings, ...refunds].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    return allTransactions;
  }

  async getPeakBookingTimes() {
    const hourlyStats = await BookingModel.aggregate([
      {
        $match: {
          status: { $in: ['confirmed', 'pending_payment'] }
        }
      },
      {
        $project: {
          hour: { $hour: '$createdAt' },
          dayOfWeek: { $dayOfWeek: '$createdAt' }
        }
      },
      {
        $group: {
          _id: '$hour',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    const hourlyData = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      count: hourlyStats.find((h) => h._id === hour)?.count || 0
    }));

    const dailyStats = await BookingModel.aggregate([
      {
        $match: {
          status: { $in: ['confirmed', 'pending_payment'] }
        }
      },
      {
        $project: {
          dayOfWeek: { $dayOfWeek: '$createdAt' }
        }
      },
      {
        $group: {
          _id: '$dayOfWeek',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dailyData = Array.from({ length: 7 }, (_, day) => ({
      day: dayNames[day],
      count: dailyStats.find((d) => d._id === day + 1)?.count || 0
    }));

    const peakHour = hourlyData.reduce((max, curr) => 
      curr.count > max.count ? curr : max, { hour: 0, count: 0 });
    const lowHour = hourlyData.reduce((min, curr) => 
      curr.count < min.count ? curr : min, { hour: 0, count: Infinity });

    const peakDay = dailyData.reduce((max, curr) => 
      curr.count > max.count ? curr : max, { day: 'N/A', count: 0 });
    const lowDay = dailyData.reduce((min, curr) => 
      curr.count < min.count ? curr : min, { day: 'N/A', count: Infinity });

    return {
      hourly: hourlyData,
      daily: dailyData,
      peakHour: peakHour.hour,
      lowHour: lowHour.hour === Infinity ? 0 : lowHour.hour,
      peakDay: peakDay.day,
      lowDay: lowDay.day === 'N/A' ? 'N/A' : lowDay.day
    };
  }
}

module.exports = new AnalyticsService();
