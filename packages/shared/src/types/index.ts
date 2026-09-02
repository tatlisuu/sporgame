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

export interface IActivityStats {
  distance: number;
  duration: number;
  secondaryStat?: string | number;
}

export interface IActivityUser {
  _id: string;
  username: string;
  avatarUrl?: string;
  eloProfiles?: Record<string, number>;
}

export interface IActivity {
  _id: string;
  id?: string;
  user: IActivityUser;
  title: string;
  sportType: SportType;
  stats: IActivityStats;
  locationString?: string;
  likes: string[];
  likesCount?: number;
  commentsCount: number;
  isLiked?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface IComment {
  _id: string;
  id?: string;
  activityId: string;
  user: IActivityUser;
  content: string;
  createdAt: string;
  updatedAt?: string;
}

export interface IUserProfile {
  _id: string;
  id?: string;
  username: string;
  email?: string;
  avatarUrl?: string;
  followersCount: number;
  followingCount: number;
  isFollowing?: boolean;
  eloProfiles: EloProfiles;
  recentActivities?: IActivity[];
  createdAt: string;
}
