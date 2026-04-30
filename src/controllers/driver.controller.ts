// ============================================================
// Driver Controller — HTTP layer for driver operations
// ============================================================
import { Request, Response } from 'express';
import { driverService } from '../services/driver.service';
import { sendSuccess, sendCreated, asyncHandler, parsePagination } from '../utils';
import { AuthenticatedRequest } from '../types';

export class DriverController {
  onboard = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { userId } = (req as AuthenticatedRequest).user;
    const driver = await driverService.onboard(userId, req.body);
    sendCreated(res, { driver });
  });

  updateLocation = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { userId } = (req as AuthenticatedRequest).user;
    await driverService.updateLocation(userId, req.body.coordinates, req.body.speed, req.body.heading, req.body.accuracy);
    sendSuccess(res, { message: 'Location updated' });
  });

  toggleAvailability = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { userId } = (req as AuthenticatedRequest).user;
    const result = await driverService.toggleAvailability(userId, req.body.isAvailable);
    sendSuccess(res, result);
  });

  getProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { userId } = (req as AuthenticatedRequest).user;
    const driver = await driverService.getDriverProfile(userId);
    sendSuccess(res, { driver });
  });

  initiateKYC = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    // For demo/landing page, use a fallback if not logged in
    const userId = (req as AuthenticatedRequest).user?.userId || '69f2376af2b41d0899bac8ce';
    const session = await driverService.initiateKYC(userId);
    sendCreated(res, session);
  });

  reviewKYC = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { userId } = (req as AuthenticatedRequest).user;
    const { sessionId } = req.params;
    await driverService.reviewKYC(sessionId as string, userId, req.body.status, req.body.reviewNotes, req.body.rejectionReason);
    sendSuccess(res, { message: 'KYC review submitted' });
  });

  getPendingKYC = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { page, limit } = parsePagination(req.query as { page?: string; limit?: string });
    const result = await driverService.getPendingKYC(page, limit);
    res.json({ success: true, data: result.sessions, pagination: { total: result.total, page, limit, totalPages: Math.ceil(result.total / limit) } });
  });
}

export const driverController = new DriverController();
