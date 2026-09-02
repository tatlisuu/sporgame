import express, { Application, Request, Response } from 'express';
import compression from 'compression';
import morgan      from 'morgan';
import { env }     from './config/env';
import { applySecurityMiddleware } from './shared/middleware/security.middleware';
import { apiRouter }               from './routes';
import { globalErrorHandler, notFoundHandler } from './shared/errors/AppError';

export function createApp(): Application {
  const app = express();

  // ── Security (Helmet, CORS, Rate Limit) ──────────────────────────────────────
  applySecurityMiddleware(app);

  // ── Body parsing ─────────────────────────────────────────────────────────────
  app.use(express.json({ limit: '10kb' }));          // 10kb cap — prevents payload bomb
  app.use(express.urlencoded({ extended: false, limit: '10kb' })); // extended:false — no prototype pollution

  // ── Compression ───────────────────────────────────────────────────────────────
  app.use(compression());

  // ── Request logging ──────────────────────────────────────────────────────────
  if (env.NODE_ENV !== 'test') {
    app.use(morgan(env.NODE_ENV === 'development' ? 'dev' : 'combined'));
  }

  // ── Health check (unauthenticated — no sensitive data) ───────────────────────
  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // ── API v1 ────────────────────────────────────────────────────────────────────
  app.use('/api/v1', apiRouter);

  // ── Catch-all & global error handler ─────────────────────────────────────────
  app.use(notFoundHandler);
  app.use(globalErrorHandler);

  return app;
}
