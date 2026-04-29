// ============================================================
// Centralized Error Handler Middleware
// Catches ALL errors, formats standard response, logs with Winston
// ============================================================
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { sendError } from '../utils/response';
import { logger } from '../config/logger';
import { Sentry } from '../config/sentry';
import { ZodError } from 'zod';
import mongoose from 'mongoose';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // ── Zod Validation Error ─────────────────────────────────
  if (err instanceof ZodError) {
    const fields: Record<string, string> = {};
    for (const issue of err.issues) {
      fields[issue.path.join('.')] = issue.message;
    }
    sendError(res, 400, 'VALIDATION_ERROR', 'Request validation failed', fields);
    return;
  }

  // ── Mongoose Validation Error ────────────────────────────
  if (err instanceof mongoose.Error.ValidationError) {
    const fields: Record<string, string> = {};
    for (const [key, val] of Object.entries(err.errors)) {
      fields[key] = val.message;
    }
    sendError(res, 400, 'VALIDATION_ERROR', 'Database validation failed', fields);
    return;
  }

  // ── Mongoose Duplicate Key ───────────────────────────────
  if (err.name === 'MongoServerError' && (err as unknown as Record<string, unknown>).code === 11000) {
    const keyValue = (err as unknown as Record<string, unknown>).keyValue as Record<string, unknown>;
    const field = Object.keys(keyValue || {})[0] || 'field';
    sendError(res, 409, 'CONFLICT', `A record with this ${field} already exists`);
    return;
  }

  // ── Mongoose Cast Error (invalid ObjectId, etc.) ─────────
  if (err instanceof mongoose.Error.CastError) {
    sendError(res, 400, 'INVALID_REQUEST', `Invalid ${err.path}: ${String(err.value)}`);
    return;
  }

  // ── Known Application Error ──────────────────────────────
  if (err instanceof AppError) {
    if (!err.isOperational) {
      logger.error('Non-operational error', {
        code: err.code,
        message: err.message,
        stack: err.stack,
      });
      Sentry.captureException(err);
    }
    sendError(res, err.statusCode, err.code, err.message, err.fields);
    return;
  }

  // ── JWT Errors ───────────────────────────────────────────
  if (err.name === 'JsonWebTokenError') {
    sendError(res, 401, 'TOKEN_INVALID', 'Invalid token');
    return;
  }
  if (err.name === 'TokenExpiredError') {
    sendError(res, 401, 'TOKEN_EXPIRED', 'Token has expired');
    return;
  }

  // ── Unknown / Unexpected Error ───────────────────────────
  logger.error('Unhandled error', {
    name: err.name,
    message: err.message,
    stack: err.stack,
  });
  Sentry.captureException(err);

  sendError(
    res,
    500,
    'INTERNAL_ERROR',
    process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message,
  );
}
