export const ELO_DEFAULTS = {
  INITIAL_RATING:   1000,
  K_FACTOR_NEW:     40,   // < 30 games
  K_FACTOR_DEFAULT: 20,
  K_FACTOR_HIGH:    10,   // > 2400 elo
  HIGH_RATING_THRESHOLD: 2400,
  NEW_PLAYER_GAME_THRESHOLD: 30,
} as const;

export const SPORT_TYPES = [
  'football',
  'basketball',
  'tennis',
  'padel',
  'volleyball',
  'badminton',
] as const;

export const PAGINATION_DEFAULTS = {
  PAGE:  1,
  LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

export const JWT_CONFIG = {
  ACCESS_TOKEN_TTL:  '15m',
  REFRESH_TOKEN_TTL: '7d',
} as const;

export const HTTP_STATUS = {
  OK:                    200,
  CREATED:               201,
  NO_CONTENT:            204,
  BAD_REQUEST:           400,
  UNAUTHORIZED:          401,
  FORBIDDEN:             403,
  NOT_FOUND:             404,
  CONFLICT:              409,
  UNPROCESSABLE_ENTITY:  422,
  TOO_MANY_REQUESTS:     429,
  INTERNAL_SERVER_ERROR: 500,
} as const;
