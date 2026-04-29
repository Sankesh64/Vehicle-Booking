// ============================================================
// Booking Validators — Zod schemas for booking routes
// ============================================================
import { z } from 'zod';

const locationSchema = z.object({
  coordinates: z.tuple([
    z.number().min(-180).max(180), // longitude
    z.number().min(-90).max(90), // latitude
  ]),
  address: z.string().min(1, 'Address is required').max(500),
});

export const fareEstimateSchema = z.object({
  pickupLocation: locationSchema,
  dropLocation: locationSchema,
  vehicleCategory: z.enum(['car', 'bike', 'auto', 'rental']),
});

export const createBookingSchema = z.object({
  pickupLocation: locationSchema,
  dropLocation: locationSchema,
  vehicleCategory: z.enum(['car', 'bike', 'auto', 'rental']),
  paymentMethod: z.enum(['online', 'cash', 'wallet']).default('online'),
  isScheduled: z.boolean().default(false),
  scheduledAt: z.string().datetime().optional(),
});

export const updateBookingStatusSchema = z.object({
  status: z.enum([
    'accepted',
    'driver_arriving',
    'in_progress',
    'completed',
    'cancelled_by_user',
    'cancelled_by_driver',
  ]),
  cancellationReason: z.string().max(500).optional(),
  rideOtp: z.string().length(4).optional(),
});

export const bookingQuerySchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('20'),
  status: z
    .enum([
      'pending',
      'searching',
      'accepted',
      'driver_arriving',
      'in_progress',
      'completed',
      'cancelled_by_user',
      'cancelled_by_driver',
      'cancelled_by_system',
      'expired',
    ])
    .optional(),
});
