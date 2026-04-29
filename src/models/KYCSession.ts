// ============================================================
// KYC Session Model — ZEGOCLOUD Video KYC records
// ============================================================
import mongoose, { Schema, Document, Model } from 'mongoose';
import { KYCStatus } from '../types';

export interface IKYCSession extends Document {
  driverId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  zegoSessionId: string;
  zegoRoomId: string;
  zegoToken?: string;
  status: KYCStatus;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewNotes?: string;
  rejectionReason?: string;
  recordingUrl?: string;
  scheduledAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const kycSessionSchema = new Schema<IKYCSession>(
  {
    driverId: {
      type: Schema.Types.ObjectId,
      ref: 'Driver',
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    zegoSessionId: {
      type: String,
      required: true,
      unique: true,
    },
    zegoRoomId: {
      type: String,
      required: true,
    },
    zegoToken: { type: String, select: false },
    status: {
      type: String,
      enum: Object.values(KYCStatus),
      default: KYCStatus.PENDING,
    },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewNotes: String,
    rejectionReason: String,
    recordingUrl: String,
    scheduledAt: Date,
    startedAt: Date,
    completedAt: Date,
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // TTL — auto-cleanup expired sessions
    },
  },
  {
    timestamps: true,
  },
);

kycSessionSchema.index({ driverId: 1, status: 1 });
kycSessionSchema.index({ status: 1 });

export const KYCSession: Model<IKYCSession> = mongoose.model<IKYCSession>(
  'KYCSession',
  kycSessionSchema,
);
