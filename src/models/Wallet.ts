// ============================================================
// Wallet & WalletLedger Models — Double-entry ledger system
// ============================================================
import mongoose, { Schema, Document, Model } from 'mongoose';
import { WalletTransactionType, WalletTransactionSource } from '../types';

// ─── Wallet ──────────────────────────────────────────────────
export interface IWallet extends Document {
  userId: mongoose.Types.ObjectId;
  balance: number;
  currency: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const walletSchema = new Schema<IWallet>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    balance: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: 'INR' },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  },
);

// ─── Indexes ─────────────────────────────────────────────────
// (userId index already defined with unique: true in schema)


export const Wallet: Model<IWallet> = mongoose.model<IWallet>('Wallet', walletSchema);

// ─── Wallet Ledger ───────────────────────────────────────────
export interface IWalletLedger extends Document {
  walletId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  type: WalletTransactionType;
  source: WalletTransactionSource;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  referenceId?: string; // bookingId, payoutId, etc.
  referenceType?: string;
  description: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const walletLedgerSchema = new Schema<IWalletLedger>(
  {
    walletId: {
      type: Schema.Types.ObjectId,
      ref: 'Wallet',
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: Object.values(WalletTransactionType),
      required: true,
    },
    source: {
      type: String,
      enum: Object.values(WalletTransactionSource),
      required: true,
    },
    amount: { type: Number, required: true, min: 0 },
    balanceBefore: { type: Number, required: true },
    balanceAfter: { type: Number, required: true },
    referenceId: String,
    referenceType: String,
    description: { type: String, required: true },
    metadata: Schema.Types.Mixed,
  },
  {
    timestamps: true,
  },
);

walletLedgerSchema.index({ walletId: 1, createdAt: -1 });
walletLedgerSchema.index({ userId: 1, createdAt: -1 });
walletLedgerSchema.index({ referenceId: 1 });

export const WalletLedger: Model<IWalletLedger> = mongoose.model<IWalletLedger>(
  'WalletLedger',
  walletLedgerSchema,
);
