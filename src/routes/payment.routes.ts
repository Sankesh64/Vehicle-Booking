// ============================================================
// Payment Routes — /api/v1/payments
// ============================================================
import { Router } from 'express';
import { paymentController } from '../controllers/payment.controller';
import { authenticate } from '../middlewares/authenticate';
import { validate } from '../middlewares/validate';
import { createOrderSchema, verifyPaymentSchema, refundSchema } from '../validators/payment.validator';
import { adminOnly } from '../middlewares/authorize';

const router = Router();

// Webhook (no auth — verified by signature)
router.post('/webhook', paymentController.handleWebhook);

// Protected
router.post('/order', authenticate as any, validate(createOrderSchema), paymentController.createOrder);
router.post('/verify', authenticate as any, validate(verifyPaymentSchema), paymentController.verifyPayment);
router.get('/wallet/balance', authenticate as any, paymentController.getWalletBalance);
router.get('/wallet/transactions', authenticate as any, paymentController.getWalletTransactions);

// Admin
router.post('/refund', authenticate as any, adminOnly as any, validate(refundSchema), paymentController.refund);

export default router;
