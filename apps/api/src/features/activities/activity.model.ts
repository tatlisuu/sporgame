import { Schema, model, Document, Types } from 'mongoose';
import { SportType, IActivityStats } from '@sporgame/shared';

interface IGpsCoordinate {
  lat: number;
  lng: number;
}

export interface IActivityDocument extends Document {
  userId:         Types.ObjectId;
  title:          string;
  sportType:      SportType;
  stats:          IActivityStats;
  distance:       number;
  duration:       number;
  locationString: string;
  gpsRoute:       IGpsCoordinate[];
  likes:          Types.ObjectId[];
  likesCount:     number;
  commentsCount:  number;
  createdAt:      Date;
  updatedAt:      Date;
}

const gpsCoordinateSchema = new Schema<IGpsCoordinate>(
  {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  { _id: false },
);

const statsSchema = new Schema<IActivityStats>(
  {
    distance:      { type: Number, required: true, default: 0 },
    duration:      { type: Number, required: true, default: 0 },
    secondaryStat: { type: Schema.Types.Mixed, default: '' },
  },
  { _id: false },
);

const activitySchema = new Schema<IActivityDocument>(
  {
    userId:         { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title:          { type: String, required: true, default: 'Antrenman' },
    sportType:      { type: String, enum: ['RUNNING', 'CYCLING', 'SWIMMING'], required: true },
    stats:          { type: statsSchema, required: true },
    distance:       { type: Number, default: 0 },
    duration:       { type: Number, default: 0 },
    locationString: { type: String, default: 'Kadıköy, İstanbul' },
    gpsRoute:       { type: [gpsCoordinateSchema], default: [] },
    likes:          [{ type: Schema.Types.ObjectId, ref: 'User', default: [] }],
    likesCount:     { type: Number, default: 0, min: 0 },
    commentsCount:  { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

activitySchema.index({ userId: 1, createdAt: -1 });
activitySchema.index({ sportType: 1, createdAt: -1 });
activitySchema.index({ createdAt: -1 });

export const Activity = model<IActivityDocument>('Activity', activitySchema);
