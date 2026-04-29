// ============================================================
// User Validators — Zod schemas for user routes
// ============================================================
import { z } from 'zod';

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).trim().optional(),
  phone: z.string().optional(),
  avatar: z.string().url().optional(),
});

export const userQuerySchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('20'),
  role: z.enum(['user', 'driver', 'admin']).optional(),
  search: z.string().optional(),
});

export const updateRoleSchema = z.object({
  role: z.enum(['user', 'driver', 'admin']),
});

export const createReviewSchema = z.object({
  bookingId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
});

export const createTicketSchema = z.object({
  bookingId: z.string().optional(),
  subject: z.string().min(1).max(200).trim(),
  description: z.string().min(1).max(2000),
  category: z.enum(['payment', 'booking', 'driver', 'account', 'technical', 'other']),
});

export const ticketMessageSchema = z.object({
  message: z.string().min(1).max(1000),
});
