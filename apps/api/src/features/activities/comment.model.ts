import { Schema, model, Document, Types } from 'mongoose';

export interface ICommentDocument extends Document {
  activityId: Types.ObjectId;
  userId:     Types.ObjectId;
  content:    string;
  createdAt:  Date;
  updatedAt:  Date;
}

const commentSchema = new Schema<ICommentDocument>(
  {
    activityId: { type: Schema.Types.ObjectId, ref: 'Activity', required: true, index: true },
    userId:     { type: Schema.Types.ObjectId, ref: 'User',     required: true, index: true },
    content:    { type: String, required: true, trim: true, maxlength: 500 },
  },
  { timestamps: true },
);

commentSchema.index({ activityId: 1, createdAt: 1 });

export const Comment = model<ICommentDocument>('Comment', commentSchema);
