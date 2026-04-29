// ============================================================
// Auth Routes — /api/v1/auth
// ============================================================
import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/authenticate';
import { validate } from '../middlewares/validate';
import { authLimiter } from '../config/rateLimiter';
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema, changePasswordSchema, deleteAccountSchema } from '../validators/auth.validator';

const router = Router();

// Public routes (rate limited)
router.post('/register', authLimiter, validate(registerSchema), authController.register);
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/refresh', authLimiter, authController.refresh);
router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', authLimiter, validate(resetPasswordSchema), authController.resetPassword);

// Protected routes
router.post('/logout', authenticate as any, authController.logout);
router.post('/logout-all', authenticate as any, authController.logoutAll);
router.get('/sessions', authenticate as any, authController.getSessions);
router.delete('/sessions/:sessionId', authenticate as any, authController.revokeSession);
router.put('/change-password', authenticate as any, validate(changePasswordSchema), authController.changePassword);
router.get('/me', authenticate as any, authController.getProfile);
router.get('/me/export', authenticate as any, authController.exportData);
router.delete('/me', authenticate as any, validate(deleteAccountSchema), authController.deleteAccount);

export default router;
