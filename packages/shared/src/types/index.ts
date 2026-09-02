export enum SportType {
  RUNNING  = 'RUNNING',
  CYCLING  = 'CYCLING',
  SWIMMING = 'SWIMMING',
}

export enum MatchStatus {
  PENDING   = 'PENDING',
  ACCEPTED  = 'ACCEPTED',
  REJECTED  = 'REJECTED',
  COMPLETED = 'COMPLETED',
}

export type EloProfiles = Record<SportType, number>;
