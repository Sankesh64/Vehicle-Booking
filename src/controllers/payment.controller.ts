// ============================================================
// Payment Controller — HTTP layer for payment operations
// ============================================================
import { Request, Response } from 'express';
import { paymentService } from '../services/payment.service';
import { sendSuccess, sendCreated, asyncHandler, parsePagination } from '../utils';
import { AuthenticatedRequest } from '../types';

export class PaymentController {
  createOrder = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { userId } = (req as AuthenticatedRequest).user;
    const order = await paymentService.createOrder(req.body.bookingId, userId);
    sendCreated(res, order);
  });

  verifyPayment = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
    const payment = await paymentService.verifyPayment(razorpayOrderId, razorpayPaymentId, razorpaySignature);
    sendSuccess(res, { payment });
  });

  handleWebhook = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const signature = req.headers['x-razorpay-signature'] as string;
    await paymentService.handleWebhook(req.body, signature);
    sendSuccess(res, { received: true });
  });

  refund = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const payment = await paymentService.processRefund(req.body.paymentId, req.body.amount, req.body.reason);
    sendSuccess(res, { payment });
  });

  getWalletBalance = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { userId } = (req as AuthenticatedRequest).user;
    const wallet = await paymentService.getWalletBalance(userId);
    sendSuccess(res, wallet);
  });

  getWalletTransactions = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { userId } = (req as AuthenticatedRequest).user;
    const { page, limit } = parsePagination(req.query as { page?: string; limit?: string });
    const { transactions, total } = await paymentService.getWalletTransactions(userId, page, limit);
    res.json({ success: true, data: transactions, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } });
  });
}

export const paymentController = new PaymentController();
