// ============================================================
// Driver Service — Onboarding, KYC, location, availability
// ============================================================
import { Driver, IDriver } from '../models/Driver';
import { Vehicle } from '../models/Vehicle';
import { User } from '../models/User';
import { KYCSession } from '../models/KYCSession';
import { LocationHistory } from '../models/LocationHistory';
import { logger } from '../config/logger';
import { NotFoundError, ValidationError, ConflictError } from '../utils/errors';
import { KYCStatus, UserRole, VehicleCategory } from '../types';
import { generateSecureToken } from '../utils/helpers';
import { zegoConfig, generateZegoToken } from '../utils/zego';

export class DriverService {
  async onboard(userId: string, data: {
    licenseNumber: string; licenseExpiry: string;
    vehicle: { category: VehicleCategory; make: string; vehicleModel: string; year: number; color: string; plateNumber: string; registrationNumber: string; baseFarePerKm: number; baseFarePerMin: number; minimumFare: number; seatingCapacity: number; fuelType: string };
  }): Promise<IDriver> {
    const existing = await Driver.findOne({ userId });
    if (existing) throw new ConflictError('Driver profile already exists');

    const driver = await Driver.create({
      userId, licenseNumber: data.licenseNumber,
      licenseExpiry: new Date(data.licenseExpiry),
      currentLocation: { type: 'Point', coordinates: [0, 0] },
    });

    const vehicle = await Vehicle.create({ driverId: driver._id, ...data.vehicle });
    driver.vehicles.push(vehicle._id);
    await driver.save();

    await User.findByIdAndUpdate(userId, { role: UserRole.DRIVER });
    logger.info('Driver onboarded', { userId, driverId: driver._id.toString() });
    return driver;
  }

  async updateLocation(userId: string, coordinates: [number, number], speed?: number, heading?: number, accuracy?: number) {
    const driver = await Driver.findOne({ userId });
    if (!driver) throw new NotFoundError('Driver profile');

    driver.currentLocation = { type: 'Point', coordinates };
    driver.lastLocationUpdate = new Date();
    await driver.save();

    await LocationHistory.create({ driverId: driver._id, bookingId: undefined, location: { type: 'Point', coordinates }, speed, heading, accuracy });
  }

  async toggleAvailability(userId: string, isAvailable: boolean) {
    const driver = await Driver.findOne({ userId });
    if (!driver) throw new NotFoundError('Driver profile');
    if (!driver.isApproved) throw new ValidationError('Driver is not approved yet');
    if (driver.isSuspended) throw new ValidationError('Driver is suspended');

    driver.isAvailable = isAvailable;
    await driver.save();
    return { isAvailable: driver.isAvailable };
  }

  async initiateKYC(userId: string) {
    const driver = await Driver.findOne({ userId });
    if (!driver) throw new NotFoundError('Driver profile');
    if (driver.kycStatus === KYCStatus.APPROVED) throw new ValidationError('KYC already approved. No re-initiation needed.');

    const sessionId = generateSecureToken(16);
    const roomId = `kyc_${driver._id}_${Date.now()}`;

    const kycSession = await KYCSession.create({
      driverId: driver._id, userId, zegoSessionId: sessionId, zegoRoomId: roomId,
      status: KYCStatus.PENDING, expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    driver.kycStatus = KYCStatus.PENDING;
    driver.kycSessionId = sessionId;
    await driver.save();

    const token = generateZegoToken(sessionId);

    logger.info('KYC session initiated', { driverId: driver._id.toString(), sessionId });
    return { 
      sessionId, 
      roomId, 
      expiresAt: kycSession.expiresAt, 
      zegoConfig: { ...zegoConfig, token } 
    };
  }

  async reviewKYC(kycSessionId: string, adminId: string, status: 'approved' | 'rejected', notes?: string, rejectionReason?: string) {
    const session = await KYCSession.findOne({ zegoSessionId: kycSessionId });
    if (!session) throw new NotFoundError('KYC session');

    const newStatus = status === 'approved' ? KYCStatus.APPROVED : KYCStatus.REJECTED;
    session.status = newStatus;
    session.reviewedBy = adminId as unknown as typeof session.reviewedBy;
    session.reviewNotes = notes;
    session.rejectionReason = rejectionReason;
    session.completedAt = new Date();
    await session.save();

    const driver = await Driver.findById(session.driverId);
    if (driver) {
      driver.kycStatus = newStatus;
      driver.kycReviewedBy = adminId as unknown as typeof driver.kycReviewedBy;
      driver.kycReviewNotes = notes;
      driver.kycCompletedAt = new Date();
      if (status === 'approved') driver.isApproved = true;
      await driver.save();

      await User.findByIdAndUpdate(driver.userId, { kycStatus: newStatus });
    }

    logger.info('KYC reviewed', { kycSessionId, status, adminId });
  }

  async getDriverProfile(userId: string) {
    const driver = await Driver.findOne({ userId }).populate('vehicles').populate('userId', 'name email phone avatar');
    if (!driver) throw new NotFoundError('Driver profile');
    return driver;
  }

  async getPendingKYC(page = 1, limit = 20) {
    const [sessions, total] = await Promise.all([
      KYCSession.find({ status: KYCStatus.PENDING }).populate({ path: 'driverId', populate: { path: 'userId', select: 'name email phone' } }).sort({ createdAt: 1 }).skip((page - 1) * limit).limit(limit),
      KYCSession.countDocuments({ status: KYCStatus.PENDING }),
    ]);
    return { sessions, total };
  }
}

export const driverService = new DriverService();
