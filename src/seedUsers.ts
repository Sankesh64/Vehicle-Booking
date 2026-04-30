import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { User } from './models/User';
import { env } from './config/env';
import { UserRole, AuthProvider, KYCStatus } from './types';
import { logger } from './config/logger';

const SEED_COUNT = 20;

async function seedUsers() {
  try {
    logger.info('Connecting to MongoDB...');
    await mongoose.connect(env.MONGODB_URI);
    logger.info('Connected! Clearing existing test users...');

    // Optional: delete existing users to avoid duplicates (except maybe admins or specific users)
    // We'll just append them. We can give them a specific naming convention to identify them.
    
    const usersToInsert = [];
    const passwordHash = await bcrypt.hash('Password123!', 10);

    for (let i = 1; i <= SEED_COUNT; i++) {
      const randomString = Math.random().toString(36).substring(7);
      usersToInsert.push({
        name: `Test User ${i} ${randomString}`,
        email: `testuser${i}_${randomString}@example.com`,
        phone: `+1555${Math.floor(100000 + Math.random() * 900000)}`,
        passwordHash,
        role: UserRole.USER,
        authProvider: AuthProvider.LOCAL,
        isEmailVerified: true,
        isPhoneVerified: true,
        kycStatus: KYCStatus.APPROVED,
      });
    }

    logger.info(`Inserting ${SEED_COUNT} test users...`);
    await User.insertMany(usersToInsert);
    logger.info(`Successfully added ${SEED_COUNT} users to the database!`);

  } catch (error) {
    logger.error('Error seeding users:', error);
  } finally {
    await mongoose.disconnect();
    logger.info('Disconnected from MongoDB.');
    process.exit(0);
  }
}

seedUsers();
