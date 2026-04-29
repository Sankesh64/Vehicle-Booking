// ============================================================
// Booking Routes — /api/v1/bookings
// ============================================================
import { Router } from 'express';
import { bookingController } from '../controllers/booking.controller';
import { authenticate } from '../middlewares/authenticate';
import { validate } from '../middlewares/validate';
import { publicLimiter } from '../config/rateLimiter';
import { fareEstimateSchema, createBookingSchema, updateBookingStatusSchema, bookingQuerySchema } from '../validators/booking.validator';

const router = Router();

// Public (rate-limited)
router.post('/estimate', publicLimiter, validate(fareEstimateSchema), bookingController.estimateFare);

// Protected
router.post('/', authenticate as any, validate(createBookingSchema), bookingController.createBooking);
router.get('/my', authenticate as any, validate(bookingQuerySchema, 'query'), bookingController.getMyBookings);
router.get('/:id', authenticate as any, bookingController.getBookingById);
router.patch('/:id/status', authenticate as any, validate(updateBookingStatusSchema), bookingController.updateStatus);
router.post('/nearby-drivers', authenticate as any, bookingController.getNearbyDrivers);

export default router;
