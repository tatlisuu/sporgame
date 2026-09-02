export * from './constants';
export * from './types';

// ─── Primitive Scalars ───────────────────────────────────────────────────────

export type ObjectIdString = string;
export type ISODateString   = string;
export type EloRating       = number;

// ─── Pagination ──────────────────────────────────────────────────────────────

export interface PaginationQuery {
  page:  number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data:       T[];
  total:      number;
  page:       number;
  totalPages: number;
}

// ─── API Response Envelope ───────────────────────────────────────────────────

export interface ApiSuccessResponse<T> {
  success: true;
  data:    T;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  error:   string;
  code?:   string;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface TokenPair {
  accessToken:  string;
  refreshToken: string;
}

export interface JwtPayload {
  sub:   ObjectIdString;
  email: string;
  iat?:  number;
  exp?:  number;
}

// ─── Users ───────────────────────────────────────────────────────────────────

export type SportType =
  | 'football'
  | 'basketball'
  | 'tennis'
  | 'padel'
  | 'volleyball'
  | 'badminton';

export interface UserSportProfile {
  sport:  SportType;
  elo:    EloRating;
}

export interface UserPublicProfile {
  _id:          ObjectIdString;
  username:     string;
  displayName:  string;
  avatarUrl?:   string;
  sports:       UserSportProfile[];
  followerCount: number;
  followingCount: number;
  createdAt:    ISODateString;
}

// ─── Activities ───────────────────────────────────────────────────────────────

export type ActivityType = SportType;

export interface GpsCoordinate {
  lat: number;
  lng: number;
}

export interface ActivitySummary {
  _id:          ObjectIdString;
  userId:       ObjectIdString;
  type:         ActivityType;
  title:        string;
  durationSecs: number;
  distanceM?:   number;
  route?:       GpsCoordinate[];
  likeCount:    number;
  commentCount: number;
  createdAt:    ISODateString;
}

// ─── Matchmaking ─────────────────────────────────────────────────────────────

export type MatchStatus = 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled';
export type MatchOutcome = 'win' | 'loss' | 'draw';

export interface MatchRequest {
  _id:         ObjectIdString;
  challengerId: ObjectIdString;
  challengedId: ObjectIdString;
  sport:       SportType;
  status:      MatchStatus;
  scheduledAt?: ISODateString;
  createdAt:   ISODateString;
}

export interface MatchResult {
  matchId:     ObjectIdString;
  winnerId:    ObjectIdString;
  eloChanges:  Record<ObjectIdString, number>;
  completedAt: ISODateString;
}

// ─── Feed ────────────────────────────────────────────────────────────────────

export type FeedItemType = 'activity' | 'match_result' | 'follow';

export interface FeedItem {
  _id:       ObjectIdString;
  type:      FeedItemType;
  actorId:   ObjectIdString;
  payload:   ActivitySummary | MatchResult | { followedUserId: ObjectIdString };
  createdAt: ISODateString;
}
