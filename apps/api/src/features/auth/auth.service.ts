import bcrypt from 'bcryptjs';
import jwt    from 'jsonwebtoken';
import { User }     from '../users/user.model';
import { AppError } from '../../shared/errors/AppError';
import { env }      from '../../config/env';
import { HTTP_STATUS } from '@sporgame/shared';
import type { JwtPayload }  from '../../shared/middleware/authenticate.middleware';
import type { RegisterDto, LoginDto, AuthResponseDto, UserPublicDto } from './auth.dto';

const SALT_ROUNDS         = 12;  // requirement: exactly 12
const REFRESH_HASH_ROUNDS = 10;  // lighter — used only for refresh token storage
const ACCESS_TOKEN_TTL_S  = 15 * 60; // 15 minutes in seconds — for client expiresIn field

// ── Token helpers ─────────────────────────────────────────────────────────────

function signTokenPair(payload: JwtPayload): AuthResponseDto {
  const accessToken  = jwt.sign(payload, env.JWT_SECRET,         { expiresIn: '15m' });
  const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: '7d'  });
  return { accessToken, refreshToken, expiresIn: ACCESS_TOKEN_TTL_S };
}

// ── Response sanitiser — NEVER return raw DB document ────────────────────────

function toUserPublicDto(user: InstanceType<typeof User>): UserPublicDto {
  return {
    id:             (user._id as object).toString(),
    username:       user.username,
    email:          user.email,
    followersCount: user.followersCount,
    followingCount: user.followingCount,
    eloProfiles:    user.eloProfiles as unknown as Record<string, number>,
    createdAt:      user.createdAt.toISOString(),
  };
}

// ── Register ──────────────────────────────────────────────────────────────────

export async function registerUser(
  dto: RegisterDto,
): Promise<{ tokens: AuthResponseDto; user: UserPublicDto }> {
  // Check uniqueness before hashing to save CPU on duplicates
  const existing = await User.findOne({
    $or: [{ email: dto.email }, { username: dto.username }],
  }).lean();

  if (existing) {
    // Generic message prevents user enumeration
    throw new AppError(HTTP_STATUS.CONFLICT, 'Credentials already in use', 'DUPLICATE_USER');
  }

  const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
  const user = await User.create({ username: dto.username, email: dto.email, passwordHash });

  const jwtPayload: JwtPayload = { sub: user.id as string, email: user.email };
  const tokens = signTokenPair(jwtPayload);

  // Hash refresh token before persisting — raw token never stored
  const refreshTokenHash = await bcrypt.hash(tokens.refreshToken, REFRESH_HASH_ROUNDS);
  await User.findByIdAndUpdate(user.id, { refreshTokenHash });

  return { tokens, user: toUserPublicDto(user) };
}

// ── Login ─────────────────────────────────────────────────────────────────────

export async function loginUser(
  dto: LoginDto,
): Promise<{ tokens: AuthResponseDto; user: UserPublicDto }> {
  // Always select passwordHash for constant-time comparison even on miss
  const user = await User.findOne({ email: dto.email }).select('+passwordHash +refreshTokenHash');

  // Constant-time path: compare against a dummy hash when user not found
  const DUMMY_HASH = '$2b$12$invalidhashfortimingprotection000000000000000000000000';
  const passwordMatch = await bcrypt.compare(
    dto.password,
    user?.passwordHash ?? DUMMY_HASH,
  );

  // Reject after constant-time check — same error for user-not-found and wrong password
  if (!user || !passwordMatch) {
    throw new AppError(HTTP_STATUS.UNAUTHORIZED, 'Invalid credentials', 'INVALID_CREDENTIALS');
  }

  const jwtPayload: JwtPayload = { sub: user.id as string, email: user.email };
  const tokens = signTokenPair(jwtPayload);

  const refreshTokenHash = await bcrypt.hash(tokens.refreshToken, REFRESH_HASH_ROUNDS);
  await User.findByIdAndUpdate(user.id, { refreshTokenHash });

  return { tokens, user: toUserPublicDto(user) };
}

// ── Refresh ───────────────────────────────────────────────────────────────────

export async function refreshAccessToken(
  incomingToken: string,
): Promise<AuthResponseDto> {
  let payload: JwtPayload;

  try {
    payload = jwt.verify(incomingToken, env.JWT_REFRESH_SECRET) as JwtPayload;
  } catch {
    // Distinguish nothing — client gets one generic message
    throw new AppError(HTTP_STATUS.UNAUTHORIZED, 'Invalid refresh token', 'TOKEN_INVALID');
  }

  const user = await User.findById(payload.sub).select('+refreshTokenHash');

  if (!user?.refreshTokenHash) {
    throw new AppError(HTTP_STATUS.UNAUTHORIZED, 'Session not found', 'SESSION_EXPIRED');
  }

  // Constant-time comparison — detects refresh token reuse attacks
  const tokenMatch = await bcrypt.compare(incomingToken, user.refreshTokenHash);

  if (!tokenMatch) {
    // Invalidate ALL sessions for this user on reuse detection (token theft signal)
    await User.findByIdAndUpdate(user.id, { refreshTokenHash: null });
    throw new AppError(HTTP_STATUS.UNAUTHORIZED, 'Token reuse detected — session revoked', 'TOKEN_REUSE');
  }

  const newPayload: JwtPayload = { sub: user.id as string, email: user.email };
  const tokens = signTokenPair(newPayload);

  // Rotate — old hash invalidated atomically
  const newRefreshTokenHash = await bcrypt.hash(tokens.refreshToken, REFRESH_HASH_ROUNDS);
  await User.findByIdAndUpdate(user.id, { refreshTokenHash: newRefreshTokenHash });

  return tokens;
}

// ── Logout ───────────────────────────────────────────────────────────────────

export async function logoutUser(userId: string): Promise<void> {
  await User.findByIdAndUpdate(userId, { refreshTokenHash: null });
}
