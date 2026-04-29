// ============================================================
// Payment Validators — Zod schemas for payment routes
// ============================================================
import { z } from 'zod';

export const createOrderSchema = z.object({
  bookingId: z.string().min(1, 'Booking ID is required'),
});

export const verifyPaymentSchema = z.object({
  razorpayOrderId: z.string().min(1),
  razorpayPaymentId: z.string().min(1),
  razorpaySignature: z.string().min(1),
});

export const refundSchema = z.object({
  paymentId: z.string().min(1),
  amount: z.number().positive().optional(), // partial or full refund
  reason: z.string().max(500).optional(),
});
