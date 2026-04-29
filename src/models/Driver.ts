// ============================================================
// Driver Model — Profile, vehicle details, live location, ratings
// ============================================================
import mongoose, { Schema, Document, Model } from 'mongoose';
import { KYCStatus, GeoJSONPoint } from '../types';

export interface IDriver extends Document {
  userId: mongoose.Types.ObjectId;

  // License
  licenseNumber: string;
  licenseExpiry: Date;
  licenseImageUrl?: string;

  // Vehicle details (primary)
  vehicles: mongoose.Types.ObjectId[];

  // Availability
  isAvailable: boolean;
  isOnTrip: boolean;
  currentLocation: GeoJSONPoint;
  lastLocationUpdate: Date;

  // Verification
  kycStatus: KYCStatus;
  kycSessionId?: string;
  kycReviewedBy?: mongoose.Types.ObjectId;
  kycReviewNotes?: string;
  kycCompletedAt?: Date;

  // Ratings & Earnings
  averageRating: number;
  totalRatings: number;
  totalTrips: number;
  totalEarnings: number;
  walletBalance: number;

  // Status
  isApproved: boolean;
  isSuspended: boolean;
  suspensionReason?: string;

  createdAt: Date;
  updatedAt: Date;
}

const pointSchema = new Schema(
  {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: [0, 0],
    },
  },
  { _id: false },
);

const driverSchema = new Schema<IDriver>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    licenseNumber: {
      type: String,
      required: [true, 'License number is required'],
      trim: true,
    },
    licenseExpiry: {
      type: Date,
      required: [true, 'License expiry date is required'],
    },
    licenseImageUrl: String,
    vehicles: [{ type: Schema.Types.ObjectId, ref: 'Vehicle' }],
    isAvailable: { type: Boolean, default: false },
    isOnTrip: { type: Boolean, default: false },
    currentLocation: {
      type: pointSchema,
      default: { type: 'Point', coordinates: [0, 0] },
    },
    lastLocationUpdate: { type: Date, default: Date.now },
    kycStatus: {
      type: String,
      enum: Object.values(KYCStatus),
      default: KYCStatus.NOT_STARTED,
    },
    kycSessionId: String,
    kycReviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    kycReviewNotes: String,
    kycCompletedAt: Date,
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    totalRatings: { type: Number, default: 0 },
    totalTrips: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 },
    walletBalance: { type: Number, default: 0 },
    isApproved: { type: Boolean, default: false },
    isSuspended: { type: Boolean, default: false },
    suspensionReason: String,
  },
  {
    timestamps: true,
  },
);

// ─── Indexes ─────────────────────────────────────────────────
driverSchema.index({ currentLocation: '2dsphere' });
driverSchema.index({ isAvailable: 1, isApproved: 1, isSuspended: 1 });
driverSchema.index({ kycStatus: 1 });

export const Driver: Model<IDriver> = mongoose.model<IDriver>('Driver', driverSchema);
