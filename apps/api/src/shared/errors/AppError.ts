import { Request, Response, NextFunction } from 'express';
import { HTTP_STATUS } from '@sporgame/shared';

// ── Typed operational error ───────────────────────────────────────────────────

export class AppError extends Error {
  public readonly isOperational = true; // flag — operational vs programmer error

  constructor(
    public readonly statusCode: number,
    public readonly message:    string,
    public readonly code?:      string,
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

// ── Global error handler ──────────────────────────────────────────────────────

export function globalErrorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // Known operational error — safe to send details to client
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error:   err.message,
      code:    err.code,
    });
    return;
  }

  // Unknown programmer error — log internally, never expose stack to client
  console.error(`[${new Date().toISOString()}] UNHANDLED ERROR on ${req.method} ${req.path}:`, err);

  res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
    success: false,
    error:   'An unexpected error occurred',
    code:    'INTERNAL_ERROR',
  });
}

// ── 404 catch-all ─────────────────────────────────────────────────────────────

export function notFoundHandler(req: Request, res: Response): void {
  res.status(HTTP_STATUS.NOT_FOUND).json({
    success: false,
    error:   `Route ${req.method} ${req.path} not found`,
    code:    'NOT_FOUND',
  });
}
