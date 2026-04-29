// ============================================================
// Health + Readiness Routes
// ============================================================
import { Router, Request, Response } from 'express';
import { isDatabaseConnected } from '../config/database';

const router = Router();

router.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    data: { status: 'healthy', timestamp: new Date().toISOString(), uptime: process.uptime() },
  });
});

router.get('/ready', (_req: Request, res: Response) => {
  const dbReady = isDatabaseConnected();
  const status = dbReady ? 200 : 503;
  res.status(status).json({
    success: dbReady,
    data: { database: dbReady ? 'connected' : 'disconnected', timestamp: new Date().toISOString() },
  });
});

export default router;
