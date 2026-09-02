import { Schema, model, Document } from 'mongoose';
import { SportType, EloProfiles } from '@sporgame/shared';

export interface IUser extends Document {
  username:         string;
  email:            string;
  passwordHash:     string;
  refreshTokenHash: string | null;
  followersCount:   number;
  followingCount:   number;
  eloProfiles:      EloProfiles;
  createdAt:        Date;
  updatedAt:        Date;
}

const DEFAULT_ELO = 1200;

const eloProfilesSchema = new Schema<EloProfiles>(
  {
    RUNNING:  { type: Number, default: DEFAULT_ELO, min: 0 },
    CYCLING:  { type: Number, default: DEFAULT_ELO, min: 0 },
    SWIMMING: { type: Number, default: DEFAULT_ELO, min: 0 },
  },
  { _id: false },
);

const userSchema = new Schema<IUser>(
  {
    username:         { type: String, required: true, unique: true, trim: true, minlength: 3, maxlength: 30 },
    email:            { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash:     { type: String, required: true,   select: false },
    refreshTokenHash: { type: String, default: null,    select: false },
    followersCount:   { type: Number, default: 0, min: 0 },
    followingCount:   { type: Number, default: 0, min: 0 },
    eloProfiles: {
      type: eloProfilesSchema,
      default: (): EloProfiles => ({
        RUNNING:  DEFAULT_ELO,
        CYCLING:  DEFAULT_ELO,
        SWIMMING: DEFAULT_ELO,
      }),
    },
  },
  { timestamps: true },
);

// unique:true on email and username already creates indexes — no schema.index() needed

export const User = model<IUser>('User', userSchema);
