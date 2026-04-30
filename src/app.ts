// ============================================================
// Express Application — Middleware stack in EXACT production order
// ============================================================
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
// import mongoSanitize from 'express-mongo-sanitize';
import { Sentry } from './config/sentry';
import { env } from './config/env';
import { globalLimiter } from './config/rateLimiter';
import { requestLogger } from './middlewares/requestLogger';
import { errorHandler } from './middlewares/errorHandler';

// Routes
import healthRoutes from './routes/health.routes';
import authRoutes from './routes/auth.routes';
import bookingRoutes from './routes/booking.routes';
import paymentRoutes from './routes/payment.routes';
import driverRoutes from './routes/driver.routes';
import adminRoutes from './routes/admin.routes';

const app = express();

// ═══════════════════════════════════════════════════════════
// MIDDLEWARE STACK — EXACT PRODUCTION ORDER
// ═══════════════════════════════════════════════════════════

// 1. Sentry request handler (must be first)
if (env.SENTRY_DSN) {
  Sentry.setupExpressErrorHandler(app);
}

// 2. Helmet — security headers
app.use(helmet());

// 3. CORS — strict origin, no wildcards
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow the specific Vercel URL and localhost directly to bypass any Render env var typos
      const allowedOrigins = [
        'https://vehicle-booking-ecru.vercel.app',
        'http://localhost:5173',
        ...env.CORS_ORIGINS.split(',').map((o) => o.trim().replace(/^['"]+|['"]+$/g, '').replace(/\/$/, ''))
      ];
      
      // If no origin (e.g. mobile app or curl) or if origin is in allowed list, permit it
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400,
  }),
);

// 4. Body parser with size limit
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// 5. Mongo sanitize — prevent NoSQL injection
// app.use(mongoSanitize());

// 6. Request logging
app.use(requestLogger);

// 7. Global rate limiter
app.use(globalLimiter);

// ═══════════════════════════════════════════════════════════
// ROUTES
// ═══════════════════════════════════════════════════════════

// Health/Readiness (excluded from aggressive rate limiting)
app.use('/', healthRoutes);

// API v1 routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/bookings', bookingRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/drivers', driverRoutes);
app.use('/api/v1/admin', adminRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: 'Route not found' },
  });
});

// ═══════════════════════════════════════════════════════════
// ERROR HANDLING (must be last)
// ═══════════════════════════════════════════════════════════

// 10. Sentry error handler
if (env.SENTRY_DSN) {
  Sentry.setupExpressErrorHandler(app);
}

// 11. Central error handler
app.use(errorHandler);

export default app;
