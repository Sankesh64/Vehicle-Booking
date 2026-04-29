// ============================================================
// RBAC (Role-Based Access Control) Middleware
// Restricts routes to specific user roles
// ============================================================
import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, UserRole } from '../types';
import { ForbiddenError } from '../utils/errors';

export function authorize(...allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new ForbiddenError('Authentication required'));
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      next(new ForbiddenError('You do not have permission to perform this action'));
      return;
    }

    next();
  };
}

// ─── Convenience role checks ─────────────────────────────────
export const adminOnly = authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN);
export const driverOnly = authorize(UserRole.DRIVER);
export const userOnly = authorize(UserRole.USER);
export const driverOrAdmin = authorize(UserRole.DRIVER, UserRole.ADMIN, UserRole.SUPER_ADMIN);
export const allAuthenticated = authorize(
  UserRole.USER,
  UserRole.DRIVER,
  UserRole.ADMIN,
  UserRole.SUPER_ADMIN,
);
