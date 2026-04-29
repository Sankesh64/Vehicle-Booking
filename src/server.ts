// ============================================================
// Server Entry Point — HTTP + Socket.io + Graceful Shutdown
// ============================================================
import http from 'http';
import app from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import { initSentry } from './config/sentry';
import { connectDatabase, disconnectDatabase } from './config/database';
import { initializeSocket } from './sockets';

async function startServer(): Promise<void> {
  // Initialize Sentry
  initSentry();

  // Connect to MongoDB
  await connectDatabase();

  // Create HTTP server
  const server = http.createServer(app);

  // Initialize Socket.io
  initializeSocket(server);

  // Start listening
  const PORT = env.PORT;
  server.listen(PORT, () => {
    logger.info(`🚀 Server running on port ${PORT} in ${env.NODE_ENV} mode`);
    logger.info(`📡 API: http://localhost:${PORT}/api/v1`);
    logger.info(`❤️  Health: http://localhost:${PORT}/health`);
    logger.info(`🔌 Socket.io: ws://localhost:${PORT}`);
  });

  // ─── Graceful Shutdown ─────────────────────────────────
  const shutdown = async (signal: string): Promise<void> => {
    logger.info(`${signal} received. Starting graceful shutdown...`);

    server.close(async () => {
      logger.info('HTTP server closed');
      await disconnectDatabase();
      logger.info('Database disconnected');
      process.exit(0);
    });

    // Force shutdown after 30 seconds
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 30000);
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));

  // ─── Unhandled Errors ──────────────────────────────────
  process.on('unhandledRejection', (reason: unknown) => {
    logger.error('Unhandled Rejection', { reason: String(reason) });
  });

  process.on('uncaughtException', (error: Error) => {
    logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
    process.exit(1);
  });
}

startServer().catch((error: Error) => {
  logger.error('Failed to start server', { error: error.message });
  process.exit(1);
});
