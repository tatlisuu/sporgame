import { z } from 'zod';

// ── Shared sanitisation helpers ──────────────────────────────────────────────

const safeString = (min: number, max: number) =>
  z.string().min(min).max(max).trim();

// ── Register ─────────────────────────────────────────────────────────────────

export const registerSchema = z
  .object({
    username: safeString(3, 30).regex(/^[a-zA-Z0-9_]+$/, 'Alphanumeric and underscores only'),
    email:    z.string().email().max(254).toLowerCase().trim(),
    password: safeString(8, 72),
  })
  .strict(); // TS2693-safe: .strict() rejects unknown keys (mass-assignment prevention)

export type RegisterDto = z.infer<typeof registerSchema>;

// ── Login ─────────────────────────────────────────────────────────────────────

export const loginSchema = z
  .object({
    email:    z.string().email().max(254).toLowerCase().trim(),
    password: safeString(1, 72),
  })
  .strict();

export type LoginDto = z.infer<typeof loginSchema>;

// ── Refresh ──────────────────────────────────────────────────────────────────

export const refreshTokenSchema = z
  .object({
    refreshToken: z.string().min(1).max(512),
  })
  .strict();

export type RefreshTokenDto = z.infer<typeof refreshTokenSchema>;

// ── Response DTOs (never expose raw DB document) ─────────────────────────────

export interface AuthResponseDto {
  accessToken:  string;
  refreshToken: string;
  expiresIn:    number; // seconds — lets clients set precise refresh timers
}

export interface UserPublicDto {
  id:             string;
  username:       string;
  email:          string;
  followersCount: number;
  followingCount: number;
  eloProfiles:    Record<string, number>;
  createdAt:      string;
}
