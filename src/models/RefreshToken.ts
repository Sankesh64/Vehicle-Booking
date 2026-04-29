// ============================================================
// Refresh Token Model — Hashed storage, rotation, reuse detection
// ============================================================
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IRefreshToken extends Document {
  userId: mongoose.Types.ObjectId;
  tokenHash: string; // bcrypt hash of the actual token
  family: string; // Token family for reuse detection
  sessionId: string;
  expiresAt: Date;
  isRevoked: boolean;
  replacedBy?: string; // Points to the new token family
  userAgent?: string;
  ipAddress?: string;
  createdAt: Date;
}

const refreshTokenSchema = new Schema<IRefreshToken>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    tokenHash: {
      type: String,
      required: true,
    },
    family: {
      type: String,
      required: true,
      index: true,
    },
    sessionId: {
      type: String,
      required: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // TTL index: auto-delete expired tokens
    },
    isRevoked: {
      type: Boolean,
      default: false,
    },
    replacedBy: String,
    userAgent: String,
    ipAddress: String,
  },
  {
    timestamps: true,
  },
);

// Compound indexes for efficient queries
refreshTokenSchema.index({ userId: 1, isRevoked: 1 });
refreshTokenSchema.index({ family: 1, isRevoked: 1 });

export const RefreshToken: Model<IRefreshToken> = mongoose.model<IRefreshToken>(
  'RefreshToken',
  refreshTokenSchema,
);
