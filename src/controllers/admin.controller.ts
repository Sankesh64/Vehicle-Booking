// ============================================================
// Admin Controller — HTTP layer for admin operations
// ============================================================
import { Request, Response } from 'express';
import { adminService } from '../services/admin.service';
import { sendSuccess, asyncHandler, parsePagination } from '../utils';
import { AuthenticatedRequest, UserRole } from '../types';

export class AdminController {
  getDashboard = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const analytics = await adminService.getDashboardAnalytics();
    sendSuccess(res, analytics);
  });

  getUsers = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { page, limit } = parsePagination(req.query as { page?: string; limit?: string });
    const role = req.query.role as string | undefined;
    const search = req.query.search as string | undefined;
    const { users, total } = await adminService.getAllUsers(page, limit, role, search);
    res.json({ success: true, data: users, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } });
  });

  updateUserRole = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { userId } = (req as AuthenticatedRequest).user;
    const user = await adminService.updateUserRole(userId, req.params.userId as string, req.body.role as UserRole);
    sendSuccess(res, { user });
  });

  suspendDriver = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    await adminService.suspendDriver(req.params.driverId as string, req.body.reason);
    sendSuccess(res, { message: 'Driver suspended' });
  });

  unsuspendDriver = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    await adminService.unsuspendDriver(req.params.driverId as string);
    sendSuccess(res, { message: 'Driver unsuspended' });
  });

  getAllBookings = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { page, limit } = parsePagination(req.query as { page?: string; limit?: string });
    const status = req.query.status as string | undefined;
    const { bookings, total } = await adminService.getAllBookings(page, limit, status);
    res.json({ success: true, data: bookings, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } });
  });

  getTickets = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { page, limit } = parsePagination(req.query as { page?: string; limit?: string });
    const status = req.query.status as string | undefined;
    const { tickets, total } = await adminService.getTickets(page, limit, status);
    res.json({ success: true, data: tickets, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } });
  });
}

export const adminController = new AdminController();
