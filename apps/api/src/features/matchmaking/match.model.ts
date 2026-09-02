import { Schema, model, Document, Types } from 'mongoose';
import { SportType, MatchStatus } from '@sporgame/shared';

export interface IMatch extends Document {
  challengerId: Types.ObjectId;
  challengedId: Types.ObjectId;
  sportType:    SportType;
  status:       MatchStatus;
  winnerId:     Types.ObjectId | null;
  eloChange:    number | null;
  createdAt:    Date;
  updatedAt:    Date;
}

const matchSchema = new Schema<IMatch>(
  {
    challengerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    challengedId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    sportType:   { type: String, enum: ['RUNNING', 'CYCLING', 'SWIMMING'],                 required: true },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    status:      { type: String, enum: ['PENDING', 'ACCEPTED', 'REJECTED', 'COMPLETED'],   default: 'PENDING' } as any,
    winnerId:    { type: Schema.Types.ObjectId, ref: 'User', default: null },
    eloChange:   { type: Number, default: null },
  },
  { timestamps: true },
);

matchSchema.index({ challengerId: 1, status: 1 });
matchSchema.index({ challengedId: 1, status: 1 });

export const Match = model<IMatch>('Match', matchSchema);
