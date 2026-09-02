import { Schema, model, Document, Types } from 'mongoose';
import { SportType } from '@sporgame/shared';

interface IGpsCoordinate {
  lat: number;
  lng: number;
}

export interface IActivity extends Document {
  userId:        Types.ObjectId;
  sportType:     SportType;
  distance:      number;
  duration:      number;
  gpsRoute:      IGpsCoordinate[];
  likes:         Types.ObjectId[];
  likesCount:    number;
  commentsCount: number;
  createdAt:     Date;
  updatedAt:     Date;
}

const gpsCoordinateSchema = new Schema<IGpsCoordinate>(
  {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  { _id: false },
);

const activitySchema = new Schema<IActivity>(
  {
    userId:        { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    sportType:     { type: String, enum: ['RUNNING', 'CYCLING', 'SWIMMING'], required: true },
    distance:      { type: Number, required: true, min: 0 },
    duration:      { type: Number, required: true, min: 0 },
    gpsRoute:      { type: [gpsCoordinateSchema], default: [] },
    likes:         [{ type: Schema.Types.ObjectId, ref: 'User', default: [] }],
    likesCount:    { type: Number, default: 0, min: 0 },
    commentsCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

activitySchema.index({ userId: 1, createdAt: -1 });
activitySchema.index({ sportType: 1, createdAt: -1 });
activitySchema.index({ createdAt: -1 });

export const Activity = model<IActivity>('Activity', activitySchema);
