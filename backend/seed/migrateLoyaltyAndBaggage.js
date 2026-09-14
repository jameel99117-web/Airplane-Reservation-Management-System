require('dotenv').config();
const mongoose = require('mongoose');
const BookingModel = require('../models/Booking');
const UserModel = require('../models/User');
const LoyaltyProgramModel = require('../models/LoyaltyProgram');
const BaggageManagementModel = require('../models/BaggageManagement');
const LoyaltyProgramService = require('../services/LoyaltyProgramService');
const BaggageManagementService = require('../services/BaggageManagementService');

async function migrate() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/airline_reservation';
  
  try {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');

    // Get all confirmed bookings with successful payments
    const bookings = await BookingModel.find({
      status: 'confirmed',
      paymentStatus: 'success'
    }).populate('flight');

    console.log(`Found ${bookings.length} confirmed bookings to migrate`);

    let loyaltyCount = 0;
    let baggageCount = 0;

    for (const booking of bookings) {
      // Add loyalty points for existing bookings
      try {
        await LoyaltyProgramService.addPoints(
          booking.user,
          booking.totalAmount,
          booking.seatNumbers.length,
          booking._id,
          'booking'
        );
        loyaltyCount++;
        console.log(`✓ Added loyalty points for booking ${booking.bookingReference}`);
      } catch (err) {
        console.error(`✗ Failed to add loyalty points for booking ${booking.bookingReference}:`, err.message);
      }

      // Create baggage management for existing bookings
      try {
        await BaggageManagementService.getOrCreateBaggageManagement(booking._id);
        baggageCount++;
        console.log(`✓ Created baggage record for booking ${booking.bookingReference}`);
      } catch (err) {
        console.error(`✗ Failed to create baggage record for booking ${booking.bookingReference}:`, err.message);
      }
    }

    console.log('\n=== Migration Summary ===');
    console.log(`Loyalty points added: ${loyaltyCount}/${bookings.length}`);
    console.log(`Baggage records created: ${baggageCount}/${bookings.length}`);
    console.log('Migration complete!');

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
  }
}

migrate();
