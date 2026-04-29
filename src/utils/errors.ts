// ============================================================
// Custom Application Error Classes
// Typed, structured errors for the centralized error handler
// ============================================================

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly fields?: Record<string, string>;

  constructor(
    statusCode: number,
    code: string,
    message: string,
    isOperational = true,
    fields?: Record<string, string>,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.fields = fields;
    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

// ─── 400 Errors ──────────────────────────────────────────────
export class ValidationError extends AppError {
  constructor(message: string, fields?: Record<string, string>) {
    super(400, 'VALIDATION_ERROR', message, true, fields);
  }
}

export class InvalidRequestError extends AppError {
  constructor(message = 'Invalid request') {
    super(400, 'INVALID_REQUEST', message);
  }
}

export class ConfirmTextMismatchError extends AppError {
  constructor() {
    super(400, 'CONFIRM_TEXT_MISMATCH', 'Confirmation text does not match');
  }
}

// ─── 401 Errors ──────────────────────────────────────────────
export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super(401, 'UNAUTHORIZED', message);
  }
}

export class TokenExpiredError extends AppError {
  constructor() {
    super(401, 'TOKEN_EXPIRED', 'Access token has expired');
  }
}

export class TokenInvalidError extends AppError {
  constructor() {
    super(401, 'TOKEN_INVALID', 'Invalid token');
  }
}

export class RefreshTokenInvalidError extends AppError {
  constructor() {
    super(401, 'REFRESH_TOKEN_INVALID', 'Invalid or expired refresh token');
  }
}

// ─── 403 Errors ──────────────────────────────────────────────
export class ForbiddenError extends AppError {
  constructor(message = 'Access denied') {
    super(403, 'FORBIDDEN', message);
  }
}

export class CannotSelfDemoteError extends AppError {
  constructor() {
    super(403, 'CANNOT_SELF_DEMOTE', 'You cannot change your own role');
  }
}

// ─── 404 Errors ──────────────────────────────────────────────
export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(404, 'NOT_FOUND', `${resource} not found`);
  }
}

// ─── 409 Errors ──────────────────────────────────────────────
export class ConflictError extends AppError {
  constructor(message = 'Resource already exists') {
    super(409, 'CONFLICT', message);
  }
}

// ─── 429 Errors ──────────────────────────────────────────────
export class RateLimitError extends AppError {
  constructor() {
    super(429, 'RATE_LIMIT_EXCEEDED', 'Too many requests');
  }
}

// ─── 500 Errors ──────────────────────────────────────────────
export class InternalError extends AppError {
  constructor(message = 'Internal server error') {
    super(500, 'INTERNAL_ERROR', message, false);
  }
}
