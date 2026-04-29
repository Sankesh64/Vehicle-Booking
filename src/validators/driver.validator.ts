// ============================================================
// Driver Validators — Zod schemas for driver routes
// ============================================================
import { z } from 'zod';

export const driverOnboardSchema = z.object({
  licenseNumber: z.string().min(5, 'License number is required').trim(),
  licenseExpiry: z.string().datetime('Invalid date format'),
  vehicle: z.object({
    category: z.enum(['car', 'bike', 'auto', 'rental']),
    make: z.string().min(1).trim(),
    vehicleModel: z.string().min(1).trim(),
    year: z.number().int().min(2000),
    color: z.string().min(1).trim(),
    plateNumber: z.string().min(1).trim().toUpperCase(),
    registrationNumber: z.string().min(1).trim(),
    baseFarePerKm: z.number().positive(),
    baseFarePerMin: z.number().positive(),
    minimumFare: z.number().positive(),
    seatingCapacity: z.number().int().min(1).default(4),
    fuelType: z.string().default('petrol'),
  }),
});

export const updateLocationSchema = z.object({
  coordinates: z.tuple([
    z.number().min(-180).max(180),
    z.number().min(-90).max(90),
  ]),
  speed: z.number().min(0).optional(),
  heading: z.number().min(0).max(360).optional(),
  accuracy: z.number().min(0).optional(),
});

export const toggleAvailabilitySchema = z.object({
  isAvailable: z.boolean(),
});

export const kycReviewSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  reviewNotes: z.string().max(1000).optional(),
  rejectionReason: z.string().max(500).optional(),
});
