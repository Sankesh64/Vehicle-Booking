// ============================================================
// Payment Service — Razorpay integration, webhooks, wallet
// ============================================================
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { Payment } from '../models/Payment';
import { Booking } from '../models/Booking';
import { Wallet, WalletLedger } from '../models/Wallet';
import { NotFoundError, ValidationError } from '../utils/errors';
import { PaymentStatus, WalletTransactionType, WalletTransactionSource } from '../types';

const razorpay = new Razorpay({
  key_id: env.RAZORPAY_KEY_ID,
  key_secret: env.RAZORPAY_KEY_SECRET,
});

export class PaymentService {
  async createOrder(bookingId: string, userId: string) {
    const booking = await Booking.findOne({ _id: bookingId, userId });
    if (!booking) throw new NotFoundError('Booking');
    if (booking.paymentStatus !== PaymentStatus.PENDING) throw new ValidationError('Payment already processed');

    const amountInPaise = Math.round(booking.estimatedFare * 100);
    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: booking.bookingNumber,
      notes: { bookingId: booking._id.toString(), userId },
    });

    const payment = await Payment.create({
      bookingId: booking._id, userId, razorpayOrderId: order.id,
      amount: amountInPaise, currency: 'INR', status: PaymentStatus.PENDING,
    });

    logger.info('Razorpay order created', { orderId: order.id, bookingId });
    return { orderId: order.id, amount: amountInPaise, currency: 'INR', paymentId: payment._id.toString(), keyId: env.RAZORPAY_KEY_ID };
  }

  async verifyPayment(razorpayOrderId: string, razorpayPaymentId: string, razorpaySignature: string) {
    const expectedSignature = crypto.createHmac('sha256', env.RAZORPAY_KEY_SECRET).update(`${razorpayOrderId}|${razorpayPaymentId}`).digest('hex');
    if (expectedSignature !== razorpaySignature) throw new ValidationError('Invalid payment signature');

    const payment = await Payment.findOne({ razorpayOrderId });
    if (!payment) throw new NotFoundError('Payment');

    payment.razorpayPaymentId = razorpayPaymentId;
    payment.status = PaymentStatus.CAPTURED;
    await payment.save();

    await Booking.findByIdAndUpdate(payment.bookingId, { paymentStatus: PaymentStatus.CAPTURED, paymentId: payment._id });
    logger.info('Payment verified', { orderId: razorpayOrderId, paymentId: razorpayPaymentId });
    return payment;
  }

  async handleWebhook(body: Record<string, unknown>, signature: string) {
    const expectedSignature = crypto.createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET).update(JSON.stringify(body)).digest('hex');
    if (expectedSignature !== signature) throw new ValidationError('Invalid webhook signature');

    const event = body.event as string;
    const payload = body.payload as Record<string, unknown>;
    logger.info('Razorpay webhook received', { event });

    const paymentEntity = ((payload?.payment as Record<string, unknown>)?.entity || {}) as Record<string, unknown>;
    const orderId = paymentEntity.order_id as string;
    if (!orderId) return;

    const payment = await Payment.findOne({ razorpayOrderId: orderId });
    if (!payment) return;

    payment.webhookEvents.push({ event, payload: paymentEntity, receivedAt: new Date() });

    if (event === 'payment.captured') {
      payment.status = PaymentStatus.CAPTURED;
      payment.razorpayPaymentId = paymentEntity.id as string;
      payment.method = paymentEntity.method as string;
      await Booking.findByIdAndUpdate(payment.bookingId, { paymentStatus: PaymentStatus.CAPTURED });
    } else if (event === 'payment.failed') {
      payment.status = PaymentStatus.FAILED;
      await Booking.findByIdAndUpdate(payment.bookingId, { paymentStatus: PaymentStatus.FAILED });
    }

    await payment.save();
  }

  async processRefund(paymentId: string, amount?: number, reason?: string) {
    const payment = await Payment.findById(paymentId);
    if (!payment) throw new NotFoundError('Payment');
    if (payment.status !== PaymentStatus.CAPTURED) throw new ValidationError('Payment not captured');

    const refundAmount = amount ? Math.round(amount * 100) : payment.amount;
    const refund = await razorpay.payments.refund(payment.razorpayPaymentId!, { amount: refundAmount, notes: { reason: reason || 'Refund' } });

    payment.refundId = refund.id;
    payment.refundAmount = refundAmount;
    payment.refundReason = reason;
    payment.refundedAt = new Date();
    payment.status = refundAmount >= payment.amount ? PaymentStatus.REFUNDED : PaymentStatus.PARTIALLY_REFUNDED;
    await payment.save();

    logger.info('Refund processed', { paymentId, refundId: refund.id });
    return payment;
  }

  async creditDriverEarnings(driverId: string, bookingId: string, amount: number) {
    const wallet = await Wallet.findOne({ userId: driverId });
    if (!wallet) throw new NotFoundError('Driver wallet');

    const commission = amount * 0.20;
    const driverEarning = amount - commission;
    const balanceBefore = wallet.balance;

    wallet.balance += driverEarning;
    await wallet.save();

    await WalletLedger.create({
      walletId: wallet._id, userId: driverId, type: WalletTransactionType.CREDIT,
      source: WalletTransactionSource.BOOKING_EARNING, amount: driverEarning,
      balanceBefore, balanceAfter: wallet.balance,
      referenceId: bookingId, referenceType: 'booking',
      description: `Earnings from booking ${bookingId}`,
    });

    logger.info('Driver earnings credited', { driverId, amount: driverEarning });
  }

  async getWalletBalance(userId: string) {
    const wallet = await Wallet.findOne({ userId });
    if (!wallet) throw new NotFoundError('Wallet');
    return { balance: wallet.balance, currency: wallet.currency };
  }

  async getWalletTransactions(userId: string, page = 1, limit = 20) {
    const wallet = await Wallet.findOne({ userId });
    if (!wallet) throw new NotFoundError('Wallet');

    const [transactions, total] = await Promise.all([
      WalletLedger.find({ walletId: wallet._id }).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      WalletLedger.countDocuments({ walletId: wallet._id }),
    ]);
    return { transactions, total };
  }
}

export const paymentService = new PaymentService();
