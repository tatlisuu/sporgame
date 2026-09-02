import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  PORT:                   z.string().default('3000'),
  NODE_ENV:               z.enum(['development', 'production', 'test']).default('development'),
  MONGODB_URI:            z.string().min(1),
  JWT_SECRET:             z.string().min(32),
  JWT_REFRESH_SECRET:     z.string().min(32),
  JWT_EXPIRES_IN:         z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  BCRYPT_SALT_ROUNDS:     z.string().transform(Number).default('12'),
  RATE_LIMIT_WINDOW_MS:   z.string().transform(Number).default('900000'),
  RATE_LIMIT_MAX:         z.string().transform(Number).default('100'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;
