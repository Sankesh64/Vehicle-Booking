// ============================================================
// Location History Model — Driver location tracking
// ============================================================
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ILocationHistory extends Document {
  driverId: mongoose.Types.ObjectId;
  bookingId?: mongoose.Types.ObjectId;
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
  speed?: number;
  heading?: number;
  accuracy?: number;
  timestamp: Date;
}

const locationHistorySchema = new Schema<ILocationHistory>(
  {
    driverId: {
      type: Schema.Types.ObjectId,
      ref: 'Driver',
      required: true,
    },
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: 'Booking',
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: { type: [Number], required: true },
    },
    speed: Number,
    heading: Number,
    accuracy: Number,
    timestamp: { type: Date, default: Date.now },
  },
  {
    timestamps: false, // Use our own timestamp for precision
  },
);

locationHistorySchema.index({ driverId: 1, timestamp: -1 });
locationHistorySchema.index({ bookingId: 1, timestamp: -1 });
locationHistorySchema.index({ location: '2dsphere' });
locationHistorySchema.index({ timestamp: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 }); // TTL: 7 days

export const LocationHistory: Model<ILocationHistory> = mongoose.model<ILocationHistory>(
  'LocationHistory',
  locationHistorySchema,
);
