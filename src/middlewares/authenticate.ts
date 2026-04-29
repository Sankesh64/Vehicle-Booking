// ============================================================
// JWT Authentication Middleware
// Verifies access token from Authorization header
// ============================================================
import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AuthenticatedRequest, AuthPayload } from '../types';
import { UnauthorizedError, TokenExpiredError, TokenInvalidError } from '../utils/errors';
import { Session } from '../models/Session';

export async function authenticate(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No access token provided');
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      throw new UnauthorizedError('No access token provided');
    }

    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as AuthPayload;

    // Verify session is still active
    const session = await Session.findOne({
      sessionId: decoded.sessionId,
      userId: decoded.userId,
      isActive: true,
    });

    if (!session) {
      throw new UnauthorizedError('Session has been revoked');
    }

    // Update last activity
    session.lastActivityAt = new Date();
    await session.save();

    req.user = {
      userId: decoded.userId,
      role: decoded.role,
      sessionId: decoded.sessionId,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      next(new TokenExpiredError());
    } else if (error instanceof jwt.JsonWebTokenError) {
      next(new TokenInvalidError());
    } else {
      next(error);
    }
  }
}
