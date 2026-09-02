import { Router }        from 'express';
import rateLimit         from 'express-rate-limit';
import { register, login, refresh, logout } from './auth.controller';
import { validate }      from '../../shared/middleware/validate.middleware';
import { authenticate }  from '../../shared/middleware/authenticate.middleware';
import { registerSchema, loginSchema, refreshTokenSchema } from './auth.dto';

// Stricter rate limiter scoped only to auth endpoints
const authRateLimiter = rateLimit({
  windowMs:        15 * 60 * 1000, // 15 min window
  max:             10,              // max 10 attempts per IP per window
  standardHeaders: true,
  legacyHeaders:   false,
  message:         { success: false, error: 'Too many requests, please try again later.', code: 'RATE_LIMITED' },
  skipSuccessfulRequests: true,     // only counts failures toward the limit
});

export const authRouter = Router();

authRouter.post('/register', authRateLimiter, validate(registerSchema),     register);
authRouter.post('/login',    authRateLimiter, validate(loginSchema),        login);
authRouter.post('/refresh',  authRateLimiter, validate(refreshTokenSchema), refresh);
authRouter.post('/logout',   authenticate,                                  logout);
