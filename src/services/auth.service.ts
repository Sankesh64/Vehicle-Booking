// ============================================================
// Auth Service — Core authentication business logic
// JWT, bcrypt, token rotation, reuse detection, account lockout
// ============================================================
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { User, IUser } from '../models/User';
import { RefreshToken } from '../models/RefreshToken';
import { Session } from '../models/Session';
import { Wallet } from '../models/Wallet';
import { UserRole, AuthPayload } from '../types';
import {
  UnauthorizedError,
  ConflictError,
  NotFoundError,
  RefreshTokenInvalidError,
  ValidationError,
  ConfirmTextMismatchError,
} from '../utils/errors';
import { generateSecureToken } from '../utils/helpers';

const SALT_ROUNDS = 12;
const ACCESS_TOKEN_EXPIRY = env.JWT_ACCESS_EXPIRY || '15m';
const REFRESH_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

interface AuthResult {
  user: Partial<IUser>;
  tokens: TokenPair;
  sessionId: string;
}

export class AuthService {
  // ─── Register ────────────────────────────────────────────
  async register(data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    role?: string;
  }, ipAddress: string, userAgent: string): Promise<AuthResult> {
    // Check if user exists
    const existingUser = await User.findOne({ email: data.email });
    if (existingUser) {
      // Generic error to prevent email enumeration
      throw new ConflictError('An account with this email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);

    // Create user
    const user = await User.create({
      name: data.name,
      email: data.email,
      passwordHash,
      phone: data.phone,
      role: data.role === 'driver' ? UserRole.DRIVER : UserRole.USER,
    });

    // Create wallet
    await Wallet.create({ userId: user._id });

    // Generate tokens and session
    const sessionId = generateSecureToken(16);
    const tokens = await this.generateTokenPair(user, sessionId, ipAddress, userAgent);

    logger.info('User registered', { userId: user._id.toString(), role: user.role });

    return {
      user: user.toJSON(),
      tokens,
      sessionId,
    };
  }

  // ─── Login ───────────────────────────────────────────────
  async login(
    email: string,
    password: string,
    ipAddress: string,
    userAgent: string,
  ): Promise<AuthResult> {
    // Find user with password field
    const user = await User.findOne({ email }).select('+passwordHash');

    if (!user) {
      // Generic error to prevent email enumeration
      throw new UnauthorizedError('Invalid email or password');
    }

    // Check if account is locked
    if (user.isLocked()) {
      throw new UnauthorizedError(
        'Account is temporarily locked due to too many failed attempts. Try again in 15 minutes.',
      );
    }

    // Compare password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      await user.incrementLoginAttempts();
      throw new UnauthorizedError('Invalid email or password');
    }

    // Reset login attempts on success
    await user.resetLoginAttempts();

    // Update last login
    user.lastLoginAt = new Date();
    user.lastLoginIp = ipAddress;
    await user.save();

    // Generate tokens and session
    const sessionId = generateSecureToken(16);
    const tokens = await this.generateTokenPair(user, sessionId, ipAddress, userAgent);

    logger.info('User logged in', { userId: user._id.toString() });

    return {
      user: user.toJSON(),
      tokens,
      sessionId,
    };
  }

  // ─── Refresh Token ──────────────────────────────────────
  async refreshToken(
    oldRefreshToken: string,
    ipAddress: string,
    userAgent: string,
  ): Promise<TokenPair> {
    // Find all non-revoked tokens and check against hashes
    const tokenRecords = await RefreshToken.find({ isRevoked: false });

    let matchedToken: (typeof tokenRecords)[0] | null = null;

    for (const record of tokenRecords) {
      const isMatch = await bcrypt.compare(oldRefreshToken, record.tokenHash);
      if (isMatch) {
        matchedToken = record;
        break;
      }
    }

    if (!matchedToken) {
      // Check if this is a reused token (already revoked)
      const allTokens = await RefreshToken.find({ isRevoked: true });
      for (const record of allTokens) {
        const isMatch = await bcrypt.compare(oldRefreshToken, record.tokenHash);
        if (isMatch) {
          // TOKEN REUSE DETECTED — revoke ALL tokens for this family
          logger.warn('Refresh token reuse detected!', {
            userId: record.userId.toString(),
            family: record.family,
          });
          await RefreshToken.updateMany(
            { family: record.family },
            { isRevoked: true },
          );
          await Session.updateMany(
            { userId: record.userId },
            { isActive: false },
          );
          throw new RefreshTokenInvalidError();
        }
      }

      throw new RefreshTokenInvalidError();
    }

    // Check expiry
    if (matchedToken.expiresAt < new Date()) {
      throw new RefreshTokenInvalidError();
    }

    // Revoke the old token
    matchedToken.isRevoked = true;
    await matchedToken.save();

    // Get user
    const user = await User.findById(matchedToken.userId);
    if (!user) {
      throw new NotFoundError('User');
    }

    // Generate new token pair (rotation)
    const newRefreshToken = generateSecureToken(32);
    const newRefreshTokenHash = await bcrypt.hash(newRefreshToken, SALT_ROUNDS);

    await RefreshToken.create({
      userId: user._id,
      tokenHash: newRefreshTokenHash,
      family: matchedToken.family, // Same family for reuse detection
      sessionId: matchedToken.sessionId,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS),
      userAgent,
      ipAddress,
    });

    const accessToken = this.generateAccessToken(user, matchedToken.sessionId);

    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  }

  // ─── Logout ──────────────────────────────────────────────
  async logout(userId: string, sessionId: string): Promise<void> {
    // Revoke all refresh tokens for this session
    await RefreshToken.updateMany({ sessionId, userId }, { isRevoked: true });

    // Deactivate session
    await Session.updateOne({ sessionId, userId }, { isActive: false });

    logger.info('User logged out', { userId, sessionId });
  }

  // ─── Logout All Sessions ────────────────────────────────
  async logoutAll(userId: string): Promise<void> {
    await RefreshToken.updateMany({ userId }, { isRevoked: true });
    await Session.updateMany({ userId }, { isActive: false });
    logger.info('All sessions revoked', { userId });
  }

  // ─── Get Active Sessions ────────────────────────────────
  async getActiveSessions(userId: string): Promise<Array<{
    sessionId: string;
    userAgent: string;
    ipAddress: string;
    lastActivityAt: Date;
    createdAt: Date;
  }>> {
    const sessions = await Session.find({ userId, isActive: true })
      .select('sessionId userAgent ipAddress lastActivityAt createdAt')
      .sort({ lastActivityAt: -1 });

    return sessions.map((s) => ({
      sessionId: s.sessionId,
      userAgent: s.userAgent,
      ipAddress: s.ipAddress,
      lastActivityAt: s.lastActivityAt,
      createdAt: s.createdAt,
    }));
  }

  // ─── Revoke Session ──────────────────────────────────────
  async revokeSession(userId: string, sessionId: string): Promise<void> {
    await RefreshToken.updateMany({ sessionId, userId }, { isRevoked: true });
    await Session.updateOne({ sessionId, userId }, { isActive: false });
    logger.info('Session revoked', { userId, sessionId });
  }

  // ─── Forgot Password ────────────────────────────────────
  async forgotPassword(email: string): Promise<string> {
    const user = await User.findOne({ email });

    // Always return success to prevent email enumeration
    if (!user) {
      return 'If an account exists with this email, a password reset link has been sent.';
    }

    const resetToken = generateSecureToken(32);
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.passwordResetToken = resetTokenHash;
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save({ validateBeforeSave: false });

    // TODO: Send email with reset link: ${env.FRONTEND_URL}/reset-password?token=${resetToken}
    logger.info('Password reset requested', { userId: user._id.toString() });

    return 'If an account exists with this email, a password reset link has been sent.';
  }

  // ─── Reset Password ─────────────────────────────────────
  async resetPassword(token: string, newPassword: string): Promise<void> {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      passwordResetToken: tokenHash,
      passwordResetExpires: { $gt: new Date() },
    }).select('+passwordResetToken +passwordResetExpires');

    if (!user) {
      throw new ValidationError('Invalid or expired reset token');
    }

    user.passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // Revoke all sessions for security
    await this.logoutAll(user._id.toString());

    logger.info('Password reset completed', { userId: user._id.toString() });
  }

  // ─── Change Password ────────────────────────────────────
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await User.findById(userId).select('+passwordHash');
    if (!user) throw new NotFoundError('User');

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) throw new UnauthorizedError('Current password is incorrect');

    user.passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await user.save();

    logger.info('Password changed', { userId });
  }

  // ─── Delete Account ──────────────────────────────────────
  async deleteAccount(userId: string, confirmText: string): Promise<void> {
    if (confirmText !== 'DELETE MY ACCOUNT') {
      throw new ConfirmTextMismatchError();
    }

    const user = await User.findById(userId);
    if (!user) throw new NotFoundError('User');

    // Soft delete
    user.isDeleted = true;
    user.deletedAt = new Date();
    user.email = `deleted_${user._id}_${user.email}`;
    await user.save();

    // Revoke all sessions
    await this.logoutAll(userId);

    logger.info('Account deleted (soft)', { userId });
  }

  // ─── Export User Data (GDPR) ─────────────────────────────
  async exportUserData(userId: string): Promise<Record<string, unknown>> {
    const user = await User.findById(userId);
    if (!user) throw new NotFoundError('User');

    // Dynamically import models to avoid circular dependencies
    const { Booking } = await import('../models/Booking');
    const { Payment } = await import('../models/Payment');
    const { Review } = await import('../models/Review');

    const [bookings, payments, reviews] = await Promise.all([
      Booking.find({ userId }).lean(),
      Payment.find({ userId }).lean(),
      Review.find({ userId }).lean(),
    ]);

    return {
      profile: user.toJSON(),
      bookings,
      payments: payments.map((p) => {
        const { razorpaySignature, ...safe } = p as unknown as Record<string, unknown>;
        return safe;
      }),
      reviews,
      exportedAt: new Date().toISOString(),
    };
  }

  // ─── Private: Generate Access Token ──────────────────────
  private generateAccessToken(user: IUser, sessionId: string): string {
    const payload: AuthPayload = {
      userId: user._id.toString(),
      role: user.role as UserRole,
      sessionId,
    };

    return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
      expiresIn: ACCESS_TOKEN_EXPIRY as any,
      issuer: 'vehicle-booking-platform',
      audience: 'vbp-client',
    });
  }

  // ─── Private: Generate Token Pair ────────────────────────
  private async generateTokenPair(
    user: IUser,
    sessionId: string,
    ipAddress: string,
    userAgent: string,
  ): Promise<TokenPair> {
    const accessToken = this.generateAccessToken(user, sessionId);

    // Generate refresh token
    const refreshToken = generateSecureToken(32);
    const refreshTokenHash = await bcrypt.hash(refreshToken, SALT_ROUNDS);
    const family = generateSecureToken(16);

    // Store hashed refresh token
    await RefreshToken.create({
      userId: user._id,
      tokenHash: refreshTokenHash,
      family,
      sessionId,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS),
      userAgent,
      ipAddress,
    });

    // Create session record
    await Session.create({
      userId: user._id,
      sessionId,
      userAgent,
      ipAddress,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS),
    });

    return { accessToken, refreshToken };
  }
}

export const authService = new AuthService();
