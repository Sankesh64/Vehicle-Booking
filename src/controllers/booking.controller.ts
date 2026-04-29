// ============================================================
// Booking Controller — HTTP layer for booking operations
// ============================================================
import { Request, Response } from 'express';
import { bookingService } from '../services/booking.service';
import { sendSuccess, sendCreated, asyncHandler, parsePagination } from '../utils';
import { AuthenticatedRequest, VehicleCategory } from '../types';

export class BookingController {
  estimateFare = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { pickupLocation, dropLocation, vehicleCategory } = req.body;
    const estimate = await bookingService.estimateFare(pickupLocation, dropLocation, vehicleCategory as VehicleCategory);
    sendSuccess(res, estimate);
  });

  createBooking = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { userId } = (req as AuthenticatedRequest).user;
    const booking = await bookingService.createBooking(userId, req.body);
    sendCreated(res, { booking });
  });

  getMyBookings = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { userId } = (req as AuthenticatedRequest).user;
    const { page, limit } = parsePagination(req.query as { page?: string; limit?: string });
    const status = req.query.status as string | undefined;
    const { bookings, total } = await bookingService.getUserBookings(userId, status, page, limit);
    res.json({ success: true, data: bookings, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } });
  });

  getBookingById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { userId } = (req as AuthenticatedRequest).user;
    const booking = await bookingService.getBookingById(req.params.id as string, userId);
    sendSuccess(res, { booking });
  });

  updateStatus = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { userId, role } = (req as AuthenticatedRequest).user;
    const booking = await bookingService.updateBookingStatus(req.params.id as string, userId, role, req.body.status, req.body);
    sendSuccess(res, { booking });
  });

  getNearbyDrivers = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { coordinates, vehicleCategory } = req.body;
    const drivers = await bookingService.findNearbyDrivers(coordinates, vehicleCategory as VehicleCategory);
    sendSuccess(res, { drivers });
  });
}

export const bookingController = new BookingController();
