import { Application } from 'express';
import helmet          from 'helmet';
import cors            from 'cors';
import rateLimit       from 'express-rate-limit';
import { env }         from '../../config/env';

// ── CORS policy ───────────────────────────────────────────────────────────────

const ALLOWED_ORIGINS_DEV = ['http://localhost:3000', 'http://localhost:19006']; // Expo dev client
const ALLOWED_ORIGINS_PROD: string[] = []; // populate from env in production

const corsOptions: cors.CorsOptions = {
  origin(origin, callback) {
    const allowed = env.NODE_ENV === 'production' ? ALLOWED_ORIGINS_PROD : ALLOWED_ORIGINS_DEV;
    // Allow no-origin requests (mobile apps, curl) only in dev
    if (!origin || allowed.includes(origin) || env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods:          ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders:   ['Content-Type', 'Authorization'],
  exposedHeaders:   ['X-RateLimit-Limit', 'X-RateLimit-Remaining'],
  credentials:      true,
  maxAge:           86400, // preflight cache 24h
};

// ── Helmet — strict security headers ─────────────────────────────────────────

const helmetOptions: Parameters<typeof helmet>[0] = {
  // HSTS: enforce HTTPS for 1 year + subdomains
  strictTransportSecurity: {
    maxAge:            31536000,
    includeSubDomains: true,
    preload:           true,
  },
  // Prevent MIME sniffing
  noSniff: true,
  // Disable browser DNS prefetch (leaks visited URLs)
  dnsPrefetchControl: { allow: false },
  // Prevent clickjacking
  frameguard: { action: 'deny' },
  // Disable X-Powered-By
  hidePoweredBy: true,
  // XSS filter (legacy browsers)
  xssFilter: true,
  // CSP — restrict resource loading for any web views
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'none'"],
      scriptSrc:  ["'none'"],
      objectSrc:  ["'none'"],
      frameAncestors: ["'none'"],
    },
  },
  // Prevent IE from opening downloads in site context
  ieNoOpen: true,
  // Referrer policy
  referrerPolicy: { policy: 'no-referrer' },
  // Cross-Origin policies
  crossOriginEmbedderPolicy:  false, // disabled: mobile apps don't serve pages
  crossOriginResourcePolicy:  { policy: 'same-origin' },
  crossOriginOpenerPolicy:    { policy: 'same-origin' },
};

// ── Global rate limiter ───────────────────────────────────────────────────────

const globalRateLimiter = rateLimit({
  windowMs:        env.RATE_LIMIT_WINDOW_MS,
  max:             env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders:   false,
  message:         { success: false, error: 'Too many requests', code: 'RATE_LIMITED' },
});

// ── Attach all security middleware ────────────────────────────────────────────

export function applySecurityMiddleware(app: Application): void {
  app.set('trust proxy', 1); // trust first proxy for accurate IP rate limiting behind LB/nginx
  app.disable('x-powered-by');

  app.use(helmet(helmetOptions));
  app.use(cors(corsOptions));
  app.use(globalRateLimiter);
}
