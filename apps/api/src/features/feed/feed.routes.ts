import { Router } from 'express';
import { authenticate } from '../../shared/middleware/authenticate.middleware';

export const feedRouter = Router();

feedRouter.use(authenticate);

// GET /api/v1/feed              — paginated social feed (following users' activities + match results)
// GET /api/v1/feed/discover     — non-followed public activities, sorted by recency/popularity

feedRouter.get('/',          (_req, res) => res.json({ todo: 'getSocialFeed' }));
feedRouter.get('/discover',  (_req, res) => res.json({ todo: 'getDiscoverFeed' }));
