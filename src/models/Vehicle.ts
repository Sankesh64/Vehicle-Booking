// ============================================================
// Vehicle Model — Category, pricing, ownership, availability
// ============================================================
import mongoose, { Schema, Document, Model } from 'mongoose';
import { VehicleCategory, VehicleStatus } from '../types';

export interface IVehicle extends Document {
  driverId: mongoose.Types.ObjectId;
  category: VehicleCategory;
  make: string;
  vehicleModel: string;
  year: number;
  color: string;
  plateNumber: string;
  registrationNumber: string;

  // Pricing
  baseFarePerKm: number;
  baseFarePerMin: number;
  minimumFare: number;
  surgeMultiplier: number;

  // Status
  status: VehicleStatus;
  isVerified: boolean;

  // Documents
  insuranceExpiry?: Date;
  registrationImageUrl?: string;
  vehicleImageUrls: string[];

  // Capacity
  seatingCapacity: number;
  fuelType: string;

  createdAt: Date;
  updatedAt: Date;
}

const vehicleSchema = new Schema<IVehicle>(
  {
    driverId: {
      type: Schema.Types.ObjectId,
      ref: 'Driver',
      required: true,
    },
    category: {
      type: String,
      enum: Object.values(VehicleCategory),
      required: [true, 'Vehicle category is required'],
    },
    make: {
      type: String,
      required: [true, 'Vehicle make is required'],
      trim: true,
    },
    vehicleModel: {
      type: String,
      required: [true, 'Vehicle model is required'],
      trim: true,
    },
    year: {
      type: Number,
      required: [true, 'Vehicle year is required'],
      min: 2000,
    },
    color: {
      type: String,
      required: [true, 'Vehicle color is required'],
      trim: true,
    },
    plateNumber: {
      type: String,
      required: [true, 'Plate number is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    registrationNumber: {
      type: String,
      required: true,
      trim: true,
    },
    baseFarePerKm: { type: Number, required: true, min: 0 },
    baseFarePerMin: { type: Number, required: true, min: 0 },
    minimumFare: { type: Number, required: true, min: 0 },
    surgeMultiplier: { type: Number, default: 1, min: 1 },
    status: {
      type: String,
      enum: Object.values(VehicleStatus),
      default: VehicleStatus.ACTIVE,
    },
    isVerified: { type: Boolean, default: false },
    insuranceExpiry: Date,
    registrationImageUrl: String,
    vehicleImageUrls: [String],
    seatingCapacity: { type: Number, default: 4, min: 1 },
    fuelType: { type: String, default: 'petrol' },
  },
  {
    timestamps: true,
  },
);

vehicleSchema.index({ driverId: 1 });
vehicleSchema.index({ category: 1, status: 1 });

export const Vehicle: Model<IVehicle> = mongoose.model<IVehicle>('Vehicle', vehicleSchema);
