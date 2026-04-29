// ============================================================
// Auth Controller — Handles HTTP layer for auth operations
// ============================================================
import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { sendSuccess, sendCreated, sendNoContent, asyncHandler } from '../utils';
import { AuthenticatedRequest } from '../types';
import { env } from '../config/env';

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/api/v1/auth',
};

export class AuthController {
  register = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { name, email, password, phone, role } = req.body;
    const result = await authService.register({ name, email, password, phone, role }, req.ip || 'unknown', req.get('user-agent') || 'unknown');
    res.cookie('refreshToken', result.tokens.refreshToken, REFRESH_COOKIE_OPTIONS);
    sendCreated(res, { user: result.user, accessToken: result.tokens.accessToken });
  });

  login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body;
    const result = await authService.login(email, password, req.ip || 'unknown', req.get('user-agent') || 'unknown');
    res.cookie('refreshToken', result.tokens.refreshToken, REFRESH_COOKIE_OPTIONS);
    sendSuccess(res, { user: result.user, accessToken: result.tokens.accessToken });
  });

  refresh = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const oldToken = req.cookies?.refreshToken;
    if (!oldToken) { res.status(401).json({ success: false, error: { code: 'REFRESH_TOKEN_INVALID', message: 'No refresh token' } }); return; }
    const tokens = await authService.refreshToken(oldToken, req.ip || 'unknown', req.get('user-agent') || 'unknown');
    res.cookie('refreshToken', tokens.refreshToken, REFRESH_COOKIE_OPTIONS);
    sendSuccess(res, { accessToken: tokens.accessToken });
  });

  logout = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { userId, sessionId } = (req as AuthenticatedRequest).user;
    await authService.logout(userId, sessionId);
    res.clearCookie('refreshToken', { path: '/api/v1/auth' });
    sendNoContent(res);
  });

  logoutAll = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { userId } = (req as AuthenticatedRequest).user;
    await authService.logoutAll(userId);
    res.clearCookie('refreshToken', { path: '/api/v1/auth' });
    sendSuccess(res, { message: 'All sessions revoked' });
  });

  getSessions = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { userId } = (req as AuthenticatedRequest).user;
    const sessions = await authService.getActiveSessions(userId);
    sendSuccess(res, { sessions });
  });

  revokeSession = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { userId } = (req as AuthenticatedRequest).user;
    const { sessionId } = req.params;
    await authService.revokeSession(userId, sessionId as string);
    sendSuccess(res, { message: 'Session revoked' });
  });

  forgotPassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const message = await authService.forgotPassword(req.body.email);
    sendSuccess(res, { message });
  });

  resetPassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    await authService.resetPassword(req.body.token, req.body.password);
    sendSuccess(res, { message: 'Password reset successful' });
  });

  changePassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { userId } = (req as AuthenticatedRequest).user;
    await authService.changePassword(userId, req.body.currentPassword, req.body.newPassword);
    sendSuccess(res, { message: 'Password changed' });
  });

  getProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { userId } = (req as AuthenticatedRequest).user;
    const { User } = await import('../models/User');
    const user = await User.findById(userId);
    if (!user) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'User not found' } }); return; }
    sendSuccess(res, { user });
  });

  deleteAccount = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { userId } = (req as AuthenticatedRequest).user;
    await authService.deleteAccount(userId, req.body.confirmText);
    res.clearCookie('refreshToken', { path: '/api/v1/auth' });
    sendSuccess(res, { message: 'Account deleted' });
  });

  exportData = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { userId } = (req as AuthenticatedRequest).user;
    const data = await authService.exportUserData(userId);
    sendSuccess(res, data);
  });
}

export const authController = new AuthController();
