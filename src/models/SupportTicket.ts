// ============================================================
// Support Ticket Model — Dispute handling, user support
// ============================================================
import mongoose, { Schema, Document, Model } from 'mongoose';
import { TicketStatus } from '../types';

export interface ISupportTicket extends Document {
  userId: mongoose.Types.ObjectId;
  bookingId?: mongoose.Types.ObjectId;
  subject: string;
  description: string;
  category: string;
  status: TicketStatus;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo?: mongoose.Types.ObjectId;
  messages: Array<{
    senderId: mongoose.Types.ObjectId;
    senderRole: string;
    message: string;
    timestamp: Date;
  }>;
  resolvedAt?: Date;
  resolution?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ticketMessageSchema = new Schema(
  {
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    senderRole: { type: String, required: true },
    message: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false },
);

const supportTicketSchema = new Schema<ISupportTicket>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: 'Booking',
    },
    subject: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: {
      type: String,
      enum: ['payment', 'booking', 'driver', 'account', 'technical', 'other'],
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(TicketStatus),
      default: TicketStatus.OPEN,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
    messages: [ticketMessageSchema],
    resolvedAt: Date,
    resolution: String,
  },
  {
    timestamps: true,
  },
);

supportTicketSchema.index({ userId: 1, status: 1 });
supportTicketSchema.index({ status: 1, priority: 1 });
supportTicketSchema.index({ assignedTo: 1, status: 1 });

export const SupportTicket: Model<ISupportTicket> = mongoose.model<ISupportTicket>(
  'SupportTicket',
  supportTicketSchema,
);
