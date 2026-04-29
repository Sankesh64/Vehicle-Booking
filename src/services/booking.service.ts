// ============================================================
// Booking Service — Ride lifecycle, fare estimation, assignment
// ============================================================
import { Booking, IBooking } from '../models/Booking';
import { Driver } from '../models/Driver';
import { logger } from '../config/logger';
import { NotFoundError, ValidationError, ForbiddenError } from '../utils/errors';
import { calculateDistance } from '../utils/helpers';
import { BookingStatus, PaymentStatus, VehicleCategory } from '../types';

const BASE_PRICING: Record<VehicleCategory, { perKm: number; perMin: number; minimum: number; baseFare: number }> = {
  [VehicleCategory.BIKE]: { perKm: 7, perMin: 1.5, minimum: 25, baseFare: 15 },
  [VehicleCategory.AUTO]: { perKm: 12, perMin: 2, minimum: 30, baseFare: 25 },
  [VehicleCategory.CAR]: { perKm: 15, perMin: 2.5, minimum: 50, baseFare: 40 },
  [VehicleCategory.RENTAL]: { perKm: 20, perMin: 3, minimum: 100, baseFare: 50 },
};

const TAX_RATE = 0.05;

export class BookingService {
  async estimateFare(
    pickup: { coordinates: [number, number] },
    drop: { coordinates: [number, number] },
    category: VehicleCategory,
  ) {
    const distanceKm = calculateDistance(pickup.coordinates[1], pickup.coordinates[0], drop.coordinates[1], drop.coordinates[0]);
    const avgSpeed = category === VehicleCategory.BIKE ? 25 : 20;
    const durationMinutes = Math.ceil((distanceKm / avgSpeed) * 60);
    const pricing = BASE_PRICING[category];
    const surgeMultiplier = 1.0;
    const distanceCharge = distanceKm * pricing.perKm;
    const timeCharge = durationMinutes * pricing.perMin;
    const subtotal = Math.max(pricing.baseFare + distanceCharge + timeCharge, pricing.minimum);
    const surgeCharge = subtotal * (surgeMultiplier - 1);
    const tax = (subtotal + surgeCharge) * TAX_RATE;
    const total = Math.round(subtotal + surgeCharge + tax);

    return {
      estimatedFare: total,
      distanceKm: Math.round(distanceKm * 10) / 10,
      durationMinutes,
      fareBreakdown: { baseFare: Math.round(pricing.baseFare), distanceCharge: Math.round(distanceCharge), timeCharge: Math.round(timeCharge), surgeCharge: Math.round(surgeCharge), tax: Math.round(tax), discount: 0, total },
      surgeMultiplier,
    };
  }

  async createBooking(userId: string, data: {
    pickupLocation: { coordinates: [number, number]; address: string };
    dropLocation: { coordinates: [number, number]; address: string };
    vehicleCategory: VehicleCategory;
    paymentMethod: string;
    isScheduled: boolean;
    scheduledAt?: string;
  }): Promise<IBooking> {
    const estimate = await this.estimateFare({ coordinates: data.pickupLocation.coordinates }, { coordinates: data.dropLocation.coordinates }, data.vehicleCategory);
    const rideOtp = Math.floor(1000 + Math.random() * 9000).toString();

    const booking = await Booking.create({
      userId, vehicleCategory: data.vehicleCategory,
      pickupLocation: { type: 'Point', coordinates: data.pickupLocation.coordinates, address: data.pickupLocation.address },
      dropLocation: { type: 'Point', coordinates: data.dropLocation.coordinates, address: data.dropLocation.address },
      isScheduled: data.isScheduled, scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined,
      status: BookingStatus.SEARCHING, statusHistory: [{ status: BookingStatus.SEARCHING, timestamp: new Date() }],
      estimatedFare: estimate.estimatedFare, distanceKm: estimate.distanceKm, durationMinutes: estimate.durationMinutes,
      surgeMultiplier: estimate.surgeMultiplier, fareBreakdown: estimate.fareBreakdown,
      paymentMethod: data.paymentMethod, rideOtp, rideOtpExpiry: new Date(Date.now() + 30 * 60 * 1000),
    });

    logger.info('Booking created', { bookingId: booking._id.toString(), userId });
    return booking;
  }

  async findNearbyDrivers(coordinates: [number, number], category: VehicleCategory, radiusKm = 5) {
    const drivers = await Driver.find({
      isAvailable: true, isApproved: true, isSuspended: false, isOnTrip: false,
      currentLocation: { $near: { $geometry: { type: 'Point', coordinates }, $maxDistance: radiusKm * 1000 } },
    }).populate({ path: 'vehicles', match: { category, status: 'active' } });

    return drivers.filter((d) => d.vehicles && d.vehicles.length > 0).map((d) => ({
      driverId: d._id.toString(),
      distance: calculateDistance(coordinates[1], coordinates[0], d.currentLocation.coordinates[1], d.currentLocation.coordinates[0]),
    })).sort((a, b) => a.distance - b.distance);
  }

  async updateBookingStatus(bookingId: string, _userId: string, _userRole: string, newStatus: BookingStatus, extra?: { cancellationReason?: string; rideOtp?: string }): Promise<IBooking> {
    const booking = await Booking.findById(bookingId);
    if (!booking) throw new NotFoundError('Booking');
    this.validateStatusTransition(booking.status, newStatus);

    if (newStatus === BookingStatus.ACCEPTED) booking.acceptedAt = new Date();
    if (newStatus === BookingStatus.DRIVER_ARRIVING) booking.driverArrivedAt = new Date();
    if (newStatus === BookingStatus.IN_PROGRESS) booking.rideStartedAt = new Date();
    if (newStatus === BookingStatus.COMPLETED) { booking.rideCompletedAt = new Date(); booking.paymentStatus = PaymentStatus.PENDING; }
    if (newStatus === BookingStatus.CANCELLED_BY_USER || newStatus === BookingStatus.CANCELLED_BY_DRIVER) {
      booking.cancelledAt = new Date();
      booking.cancellationReason = extra?.cancellationReason || 'No reason';
      booking.cancellationFee = booking.driverId ? Math.min(50, booking.estimatedFare * 0.1) : 0;
    }

    booking.status = newStatus;
    booking.statusHistory.push({ status: newStatus, timestamp: new Date() });
    await booking.save();
    logger.info('Booking status updated', { bookingId, to: newStatus });
    return booking;
  }

  async getUserBookings(userId: string, status?: string, page = 1, limit = 20) {
    const filter: Record<string, unknown> = { userId };
    if (status) filter.status = status;
    const [bookings, total] = await Promise.all([
      Booking.find(filter).populate('driverId', 'userId averageRating').populate('vehicleId', 'make model plateNumber color').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      Booking.countDocuments(filter),
    ]);
    return { bookings, total };
  }

  async getBookingById(bookingId: string, userId: string): Promise<IBooking> {
    const booking = await Booking.findById(bookingId).populate('driverId').populate('vehicleId');
    if (!booking) throw new NotFoundError('Booking');
    if (booking.userId.toString() !== userId && booking.driverId?.toString() !== userId) throw new ForbiddenError('No access');
    return booking;
  }

  private validateStatusTransition(current: BookingStatus, next: BookingStatus): void {
    const valid: Record<string, string[]> = {
      [BookingStatus.PENDING]: [BookingStatus.SEARCHING, BookingStatus.CANCELLED_BY_USER],
      [BookingStatus.SEARCHING]: [BookingStatus.ACCEPTED, BookingStatus.CANCELLED_BY_USER, BookingStatus.EXPIRED],
      [BookingStatus.ACCEPTED]: [BookingStatus.DRIVER_ARRIVING, BookingStatus.CANCELLED_BY_USER, BookingStatus.CANCELLED_BY_DRIVER],
      [BookingStatus.DRIVER_ARRIVING]: [BookingStatus.IN_PROGRESS, BookingStatus.CANCELLED_BY_USER, BookingStatus.CANCELLED_BY_DRIVER],
      [BookingStatus.IN_PROGRESS]: [BookingStatus.COMPLETED],
    };
    if (!(valid[current] || []).includes(next)) throw new ValidationError(`Cannot transition from "${current}" to "${next}"`);
  }
}

export const bookingService = new BookingService();
