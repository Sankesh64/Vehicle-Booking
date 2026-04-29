// ============================================================
// User Model — Core user schema with auth, sessions, soft delete
// ============================================================
import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcrypt';
import { UserRole, AuthProvider, KYCStatus } from '../types';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  phone?: string;
  passwordHash?: string;
  avatar?: string;
  role: UserRole;
  authProvider: AuthProvider;
  googleId?: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  kycStatus: KYCStatus;

  // Security
  loginAttempts: number;
  lockUntil?: Date;
  lastLoginAt?: Date;
  lastLoginIp?: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;

  // Soft delete
  isDeleted: boolean;
  deletedAt?: Date;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;

  // Methods
  comparePassword(candidatePassword: string): Promise<boolean>;
  isLocked(): boolean;
  incrementLoginAttempts(): Promise<void>;
  resetLoginAttempts(): Promise<void>;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    phone: {
      type: String,
      trim: true,
      sparse: true,
    },
    passwordHash: {
      type: String,
      select: false, // Never return in queries by default
    },
    avatar: String,
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.USER,
    },
    authProvider: {
      type: String,
      enum: Object.values(AuthProvider),
      default: AuthProvider.LOCAL,
    },
    googleId: {
      type: String,
      sparse: true,
      unique: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    isPhoneVerified: {
      type: Boolean,
      default: false,
    },
    kycStatus: {
      type: String,
      enum: Object.values(KYCStatus),
      default: KYCStatus.NOT_STARTED,
    },

    // ─── Security ─────────────────────────────────
    loginAttempts: { type: Number, default: 0 },
    lockUntil: Date,
    lastLoginAt: Date,
    lastLoginIp: String,
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },

    // ─── Soft Delete ──────────────────────────────
    isDeleted: { type: Boolean, default: false },
    deletedAt: Date,
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete (ret as Record<string, unknown>).passwordHash;
        delete (ret as Record<string, unknown>).loginAttempts;
        delete (ret as Record<string, unknown>).lockUntil;
        delete (ret as Record<string, unknown>).__v;
        delete (ret as Record<string, unknown>).passwordResetToken;
        delete (ret as Record<string, unknown>).passwordResetExpires;
        return ret;
      },
    },
  },
);

// ─── Indexes ─────────────────────────────────────────────────
userSchema.index({ role: 1 });
userSchema.index({ isDeleted: 1 });
userSchema.index({ createdAt: -1 });

// ─── Pre-query middleware: Exclude soft-deleted by default ───
userSchema.pre(/^find/, function (this: mongoose.Query<unknown, unknown>, next) {
  const query = this.getFilter();
  if (!('isDeleted' in query)) {
    this.where({ isDeleted: false });
  }
  if (typeof next === 'function') next();
});

// ─── Instance Methods ────────────────────────────────────────
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  if (!this.passwordHash) return false;
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

userSchema.methods.isLocked = function (): boolean {
  return !!(this.lockUntil && this.lockUntil > new Date());
};

userSchema.methods.incrementLoginAttempts = async function (): Promise<void> {
  // Reset if lock has expired
  if (this.lockUntil && this.lockUntil < new Date()) {
    await this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 },
    });
    return;
  }

  const updates: Record<string, unknown> = { $inc: { loginAttempts: 1 } };

  // Lock after 5 attempts for 15 minutes
  if (this.loginAttempts + 1 >= 5) {
    updates.$set = { lockUntil: new Date(Date.now() + 15 * 60 * 1000) };
  }

  await this.updateOne(updates);
};

userSchema.methods.resetLoginAttempts = async function (): Promise<void> {
  await this.updateOne({
    $set: { loginAttempts: 0 },
    $unset: { lockUntil: 1 },
  });
};

export const User: Model<IUser> = mongoose.model<IUser>('User', userSchema);
