// ============================================================
// Payment Model — Razorpay integration, transaction logging
// ============================================================
import mongoose, { Schema, Document, Model } from 'mongoose';
import { PaymentStatus } from '../types';

export interface IPayment extends Document {
  bookingId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;

  // Razorpay
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;

  // Amount
  amount: number; // in paise (smallest currency unit)
  currency: string;

  // Status
  status: PaymentStatus;

  // Refund
  refundId?: string;
  refundAmount?: number;
  refundReason?: string;
  refundedAt?: Date;

  // Webhook log
  webhookEvents: Array<{
    event: string;
    payload: Record<string, unknown>;
    receivedAt: Date;
  }>;

  // Metadata
  method?: string; // card, upi, netbanking, wallet
  bank?: string;
  vpa?: string; // UPI ID (stored encrypted if needed)

  createdAt: Date;
  updatedAt: Date;
}

const webhookEventSchema = new Schema(
  {
    event: { type: String, required: true },
    payload: { type: Schema.Types.Mixed },
    receivedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const paymentSchema = new Schema<IPayment>(
  {
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    razorpayOrderId: {
      type: String,
      required: true,
      unique: true,
    },
    razorpayPaymentId: String,
    razorpaySignature: { type: String, select: false },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR' },
    status: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.PENDING,
    },
    refundId: String,
    refundAmount: Number,
    refundReason: String,
    refundedAt: Date,
    webhookEvents: [webhookEventSchema],
    method: String,
    bank: String,
    vpa: String,
  },
  {
    timestamps: true,
  },
);

paymentSchema.index({ bookingId: 1 });
paymentSchema.index({ userId: 1 });
paymentSchema.index({ razorpayPaymentId: 1 }, { sparse: true });
paymentSchema.index({ status: 1 });

export const Payment: Model<IPayment> = mongoose.model<IPayment>('Payment', paymentSchema);
