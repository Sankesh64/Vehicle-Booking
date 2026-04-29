// ============================================================
// TypeScript Type Definitions
// ============================================================
import { Request } from 'express';

// ─── User Roles ──────────────────────────────────────────────
export enum UserRole {
  USER = 'user',
  DRIVER = 'driver',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
}

// ─── Auth Provider ───────────────────────────────────────────
export enum AuthProvider {
  LOCAL = 'local',
  GOOGLE = 'google',
}

// ─── KYC Status ──────────────────────────────────────────────
export enum KYCStatus {
  NOT_STARTED = 'not_started',
  PENDING = 'pending',
  IN_REVIEW = 'in_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

// ─── Vehicle Category ────────────────────────────────────────
export enum VehicleCategory {
  CAR = 'car',
  BIKE = 'bike',
  AUTO = 'auto',
  RENTAL = 'rental',
}

// ─── Vehicle Status ──────────────────────────────────────────
export enum VehicleStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  MAINTENANCE = 'maintenance',
  SUSPENDED = 'suspended',
}

// ─── Booking Status ──────────────────────────────────────────
export enum BookingStatus {
  PENDING = 'pending',
  SEARCHING = 'searching',
  ACCEPTED = 'accepted',
  DRIVER_ARRIVING = 'driver_arriving',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED_BY_USER = 'cancelled_by_user',
  CANCELLED_BY_DRIVER = 'cancelled_by_driver',
  CANCELLED_BY_SYSTEM = 'cancelled_by_system',
  EXPIRED = 'expired',
}

// ─── Payment Status ──────────────────────────────────────────
export enum PaymentStatus {
  PENDING = 'pending',
  AUTHORIZED = 'authorized',
  CAPTURED = 'captured',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded',
}

// ─── Wallet Transaction Type ─────────────────────────────────
export enum WalletTransactionType {
  CREDIT = 'credit',
  DEBIT = 'debit',
}

// ─── Wallet Transaction Source ───────────────────────────────
export enum WalletTransactionSource {
  BOOKING_PAYMENT = 'booking_payment',
  BOOKING_EARNING = 'booking_earning',
  REFUND = 'refund',
  PAYOUT = 'payout',
  ADMIN_ADJUSTMENT = 'admin_adjustment',
  BONUS = 'bonus',
}

// ─── Notification Type ───────────────────────────────────────
export enum NotificationType {
  BOOKING = 'booking',
  PAYMENT = 'payment',
  SYSTEM = 'system',
  PROMOTION = 'promotion',
  KYC = 'kyc',
}

// ─── Support Ticket Status ───────────────────────────────────
export enum TicketStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

// ─── Authenticated Request ───────────────────────────────────
export interface AuthPayload {
  userId: string;
  role: UserRole;
  sessionId: string;
}

export interface AuthenticatedRequest extends Request {
  user: AuthPayload;
}

// ─── GeoJSON Point ───────────────────────────────────────────
export interface GeoJSONPoint {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

// ─── Pagination Query ────────────────────────────────────────
export interface PaginationQuery {
  page?: string;
  limit?: string;
}
