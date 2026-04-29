// ============================================================
// Booking Model — Full lifecycle with GeoJSON locations
// ============================================================
import mongoose, { Schema, Document, Model } from 'mongoose';
import { BookingStatus, PaymentStatus, VehicleCategory } from '../types';

export interface IBooking extends Document {
  bookingNumber: string;
  userId: mongoose.Types.ObjectId;
  driverId?: mongoose.Types.ObjectId;
  vehicleId?: mongoose.Types.ObjectId;

  // Ride details
  vehicleCategory: VehicleCategory;
  pickupLocation: {
    type: 'Point';
    coordinates: [number, number];
    address: string;
  };
  dropLocation: {
    type: 'Point';
    coordinates: [number, number];
    address: string;
  };

  // Schedule
  isScheduled: boolean;
  scheduledAt?: Date;

  // Status lifecycle
  status: BookingStatus;
  statusHistory: Array<{
    status: BookingStatus;
    timestamp: Date;
    note?: string;
  }>;

  // Fare
  estimatedFare: number;
  actualFare?: number;
  distanceKm: number;
  durationMinutes: number;
  surgeMultiplier: number;
  fareBreakdown: {
    baseFare: number;
    distanceCharge: number;
    timeCharge: number;
    surgeCharge: number;
    tax: number;
    discount: number;
    total: number;
  };

  // Payment
  paymentStatus: PaymentStatus;
  paymentId?: mongoose.Types.ObjectId;
  paymentMethod: string;

  // Cancellation
  cancelledBy?: mongoose.Types.ObjectId;
  cancellationReason?: string;
  cancellationFee: number;

  // OTP for ride verification
  rideOtp?: string;
  rideOtpExpiry?: Date;

  // Timestamps
  acceptedAt?: Date;
  driverArrivedAt?: Date;
  rideStartedAt?: Date;
  rideCompletedAt?: Date;
  cancelledAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

const bookingLocationSchema = new Schema(
  {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true },
    address: { type: String, required: true },
  },
  { _id: false },
);

const fareBreakdownSchema = new Schema(
  {
    baseFare: { type: Number, default: 0 },
    distanceCharge: { type: Number, default: 0 },
    timeCharge: { type: Number, default: 0 },
    surgeCharge: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
  },
  { _id: false },
);

const statusHistorySchema = new Schema(
  {
    status: { type: String, enum: Object.values(BookingStatus), required: true },
    timestamp: { type: Date, default: Date.now },
    note: String,
  },
  { _id: false },
);

const bookingSchema = new Schema<IBooking>(
  {
    bookingNumber: {
      type: String,
      unique: true,
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    driverId: {
      type: Schema.Types.ObjectId,
      ref: 'Driver',
    },
    vehicleId: {
      type: Schema.Types.ObjectId,
      ref: 'Vehicle',
    },
    vehicleCategory: {
      type: String,
      enum: Object.values(VehicleCategory),
      required: true,
    },
    pickupLocation: {
      type: bookingLocationSchema,
      required: true,
    },
    dropLocation: {
      type: bookingLocationSchema,
      required: true,
    },
    isScheduled: { type: Boolean, default: false },
    scheduledAt: Date,
    status: {
      type: String,
      enum: Object.values(BookingStatus),
      default: BookingStatus.PENDING,
    },
    statusHistory: [statusHistorySchema],
    estimatedFare: { type: Number, required: true },
    actualFare: Number,
    distanceKm: { type: Number, required: true },
    durationMinutes: { type: Number, required: true },
    surgeMultiplier: { type: Number, default: 1 },
    fareBreakdown: fareBreakdownSchema,
    paymentStatus: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.PENDING,
    },
    paymentId: { type: Schema.Types.ObjectId, ref: 'Payment' },
    paymentMethod: { type: String, default: 'online' },
    cancelledBy: { type: Schema.Types.ObjectId, ref: 'User' },
    cancellationReason: String,
    cancellationFee: { type: Number, default: 0 },
    rideOtp: { type: String, select: false },
    rideOtpExpiry: { type: Date, select: false },
    acceptedAt: Date,
    driverArrivedAt: Date,
    rideStartedAt: Date,
    rideCompletedAt: Date,
    cancelledAt: Date,
  },
  {
    timestamps: true,
  },
);

// ─── Indexes ─────────────────────────────────────────────────
bookingSchema.index({ userId: 1, status: 1 });
bookingSchema.index({ driverId: 1, status: 1 });
bookingSchema.index({ createdAt: -1 });
bookingSchema.index({ 'pickupLocation': '2dsphere' });
bookingSchema.index({ status: 1, isScheduled: 1 });

// ─── Auto-generate booking number ───────────────────────────
bookingSchema.pre('validate', function (next) {
  if (!this.bookingNumber) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.bookingNumber = `VB-${timestamp}-${random}`;
  }
  if (typeof next === 'function') next();
});

export const Booking: Model<IBooking> = mongoose.model<IBooking>('Booking', bookingSchema);
