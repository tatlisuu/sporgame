import { Request, Response, NextFunction } from 'express';
import jwt, { TokenExpiredError, JsonWebTokenError } from 'jsonwebtoken';
import { env } from '../../config/env';
import { AppError } from '../errors/AppError';
import { HTTP_STATUS } from '@sporgame/shared';

export interface JwtPayload {
  sub:   string;
  email: string;
  iat?:  number;
  exp?:  number;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return next(new AppError(HTTP_STATUS.UNAUTHORIZED, 'Authentication required', 'AUTH_REQUIRED'));
  }

  const token = authHeader.slice(7);

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    req.user = { sub: decoded.sub, email: decoded.email }; // explicit projection — no extra claims leaked
    next();
  } catch (err) {
    // Differentiate expired vs invalid — no stack traces exposed to client
    if (err instanceof TokenExpiredError) {
      return next(new AppError(HTTP_STATUS.UNAUTHORIZED, 'Token expired', 'TOKEN_EXPIRED'));
    }
    if (err instanceof JsonWebTokenError) {
      return next(new AppError(HTTP_STATUS.UNAUTHORIZED, 'Invalid token', 'TOKEN_INVALID'));
    }
    next(new AppError(HTTP_STATUS.UNAUTHORIZED, 'Authentication failed', 'AUTH_FAILED'));
  }
}
