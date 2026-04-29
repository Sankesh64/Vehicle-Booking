// ============================================================
// Admin Service — Analytics, moderation, user management
// ============================================================
import { User } from '../models/User';
import { Driver } from '../models/Driver';
import { Booking } from '../models/Booking';
import { Payment } from '../models/Payment';
import { SupportTicket } from '../models/SupportTicket';
import { NotFoundError, CannotSelfDemoteError } from '../utils/errors';
import { UserRole, BookingStatus, PaymentStatus, KYCStatus, TicketStatus } from '../types';

export class AdminService {
  async getDashboardAnalytics() {
    const [totalUsers, totalDrivers, totalBookings, activeBookings, totalRevenue, pendingKYC, openTickets] = await Promise.all([
      User.countDocuments({ isDeleted: false }),
      Driver.countDocuments(),
      Booking.countDocuments(),
      Booking.countDocuments({ status: { $in: [BookingStatus.SEARCHING, BookingStatus.ACCEPTED, BookingStatus.DRIVER_ARRIVING, BookingStatus.IN_PROGRESS] } }),
      Payment.aggregate([{ $match: { status: PaymentStatus.CAPTURED } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Driver.countDocuments({ kycStatus: KYCStatus.PENDING }),
      SupportTicket.countDocuments({ status: { $in: [TicketStatus.OPEN, TicketStatus.IN_PROGRESS] } }),
    ]);

    return {
      totalUsers, totalDrivers, totalBookings, activeBookings,
      totalRevenue: totalRevenue[0]?.total || 0, pendingKYC, openTickets,
    };
  }

  async getAllUsers(page = 1, limit = 20, role?: string, search?: string) {
    const filter: Record<string, unknown> = { isDeleted: false };
    if (role) filter.role = role;
    if (search) filter.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];

    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      User.countDocuments(filter),
    ]);
    return { users, total };
  }

  async updateUserRole(adminId: string, targetUserId: string, newRole: UserRole) {
    if (adminId === targetUserId) throw new CannotSelfDemoteError();
    const user = await User.findById(targetUserId);
    if (!user) throw new NotFoundError('User');
    user.role = newRole;
    await user.save();
    return user;
  }

  async suspendDriver(driverId: string, reason: string) {
    const driver = await Driver.findById(driverId);
    if (!driver) throw new NotFoundError('Driver');
    driver.isSuspended = true;
    driver.isAvailable = false;
    driver.suspensionReason = reason;
    await driver.save();
  }

  async unsuspendDriver(driverId: string) {
    const driver = await Driver.findById(driverId);
    if (!driver) throw new NotFoundError('Driver');
    driver.isSuspended = false;
    driver.suspensionReason = undefined;
    await driver.save();
  }

  async getAllBookings(page = 1, limit = 20, status?: string) {
    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    const [bookings, total] = await Promise.all([
      Booking.find(filter).populate('userId', 'name email').populate('driverId').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      Booking.countDocuments(filter),
    ]);
    return { bookings, total };
  }

  async getTickets(page = 1, limit = 20, status?: string) {
    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    const [tickets, total] = await Promise.all([
      SupportTicket.find(filter).populate('userId', 'name email').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      SupportTicket.countDocuments(filter),
    ]);
    return { tickets, total };
  }
}

export const adminService = new AdminService();
