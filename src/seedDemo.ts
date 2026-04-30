import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { User } from './models/User';
import { Driver } from './models/Driver';
import { env } from './config/env';
import { UserRole, AuthProvider, KYCStatus, VehicleCategory } from './types';
import { Vehicle } from './models/Vehicle';
import { logger } from './config/logger';

async function seedDemo() {
  try {
    logger.info('Connecting to MongoDB...');
    await mongoose.connect(env.MONGODB_URI);
    logger.info('Connected!');

    const passwordHash = await bcrypt.hash('DemoPass123!', 10);

    // Create or find a demo driver user
    let demoUser = await User.findOne({ email: 'demo-driver@veloride.app' });
    if (!demoUser) {
      demoUser = await User.create({
        name: 'Demo Driver',
        email: 'demo-driver@veloride.app',
        phone: '+919876543210',
        passwordHash,
        role: UserRole.DRIVER,
        authProvider: AuthProvider.LOCAL,
        isEmailVerified: true,
        isPhoneVerified: true,
        kycStatus: KYCStatus.NOT_STARTED,
      });
      logger.info('Demo user created', { userId: demoUser._id.toString() });
    } else {
      logger.info('Demo user already exists', { userId: demoUser._id.toString() });
    }

    // Create or find a demo driver profile
    let demoDriver = await Driver.findOne({ userId: demoUser._id });
    if (!demoDriver) {
      demoDriver = await Driver.create({
        userId: demoUser._id,
        licenseNumber: 'DL-DEMO-2026-001',
        licenseExpiry: new Date('2028-12-31'),
        currentLocation: { type: 'Point', coordinates: [72.8777, 19.0760] }, // Mumbai
        isAvailable: true,
        isApproved: false,
        kycStatus: KYCStatus.NOT_STARTED,
      });

      // Create a demo vehicle
      const vehicle = await Vehicle.create({
        driverId: demoDriver._id,
        category: VehicleCategory.CAR,
        make: 'Maruti Suzuki',
        vehicleModel: 'Swift Dzire',
        year: 2024,
        color: 'Pearl White',
        plateNumber: 'MH 01 AB 1234',
        registrationNumber: 'MH01AB1234',
        baseFarePerKm: 15,
        baseFarePerMin: 2.5,
        minimumFare: 50,
        seatingCapacity: 4,
        fuelType: 'petrol',
      });

      demoDriver.vehicles.push(vehicle._id);
      await demoDriver.save();
      logger.info('Demo driver created', { driverId: demoDriver._id.toString() });
    } else {
      logger.info('Demo driver already exists', { driverId: demoDriver._id.toString() });
    }

    logger.info('=== DEMO DRIVER USER ID ===');
    logger.info(demoUser._id.toString());
    logger.info('Use this ID in the driver controller fallback');

  } catch (error) {
    logger.error('Error seeding demo data:', error);
  } finally {
    await mongoose.disconnect();
    logger.info('Disconnected from MongoDB.');
    process.exit(0);
  }
}

seedDemo();
