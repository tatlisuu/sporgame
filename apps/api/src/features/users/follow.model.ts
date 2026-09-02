import { Schema, model, Document, Types } from 'mongoose';

export interface IFollowDocument extends Document {
  followerId:  Types.ObjectId;
  followingId: Types.ObjectId;
  createdAt:   Date;
}

const followSchema = new Schema<IFollowDocument>(
  {
    followerId:  { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    followingId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

followSchema.index({ followerId: 1, followingId: 1 }, { unique: true });

export const Follow = model<IFollowDocument>('Follow', followSchema);
