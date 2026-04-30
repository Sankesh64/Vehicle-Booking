// ============================================================
// Environment Configuration - Validated with Zod at Startup
// App CRASHES if any required env variable is missing or invalid
// ============================================================
import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const envSchema = z.object({
  // ─── Server ────────────────────────────────────────────
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  API_VERSION: z.string().default('v1'),

  // ─── MongoDB ───────────────────────────────────────────
  MONGODB_URI: z
    .string()
    .min(1, 'MONGODB_URI is required'),

  // ─── JWT Secrets (minimum 64 chars each) ───────────────
  JWT_ACCESS_SECRET: z.string().min(64, 'JWT_ACCESS_SECRET must be at least 64 characters'),
  JWT_REFRESH_SECRET: z.string().min(64, 'JWT_REFRESH_SECRET must be at least 64 characters'),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),

  // ─── Encryption ────────────────────────────────────────
  ENCRYPTION_KEY: z
    .string()
    .length(64, 'ENCRYPTION_KEY must be exactly 64 hex characters')
    .regex(/^[0-9a-fA-F]+$/, 'ENCRYPTION_KEY must be hexadecimal'),

  // ─── CORS ──────────────────────────────────────────────
  CORS_ORIGINS: z.string().min(1, 'CORS_ORIGINS is required (comma-separated)'),

  // ─── Razorpay ──────────────────────────────────────────
  RAZORPAY_KEY_ID: z.string().min(1, 'RAZORPAY_KEY_ID is required'),
  RAZORPAY_KEY_SECRET: z.string().min(1, 'RAZORPAY_KEY_SECRET is required'),
  RAZORPAY_WEBHOOK_SECRET: z.string().min(1, 'RAZORPAY_WEBHOOK_SECRET is required'),

  // ─── ZEGOCLOUD ─────────────────────────────────────────
  ZEGO_APP_ID: z.string().min(1, 'ZEGO_APP_ID is required'),
  ZEGO_SERVER_SECRET: z.string().min(1, 'ZEGO_SERVER_SECRET is required'),
  ZEGO_APP_SIGN: z.string().min(1, 'ZEGO_APP_SIGN is required'),
  ZEGO_WSS_URL: z.string().url().min(1, 'ZEGO_WSS_URL is required'),

  // ─── Sentry ────────────────────────────────────────────
  SENTRY_DSN: z.string().url().optional(),

  // ─── Redis (optional, for scaling) ─────────────────────
  REDIS_URL: z.string().url().optional(),

  // ─── Email (for password reset) ────────────────────────
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  FROM_EMAIL: z.string().email().optional(),

  // ─── Frontend URL ──────────────────────────────────────
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('❌ FATAL: Invalid environment configuration:');
    console.error(result.error.format());
    process.exit(1);
  }

  return result.data;
}

export const env = validateEnv();
