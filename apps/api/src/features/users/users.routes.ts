import { Router } from 'express';
import { authenticate } from '../../shared/middleware/authenticate.middleware';

export const usersRouter = Router();

usersRouter.use(authenticate);

// GET  /api/v1/users/:id        — get public profile
// GET  /api/v1/users/me         — get own profile
// PATCH /api/v1/users/me        — update own profile
// POST /api/v1/users/:id/follow — follow/unfollow
// GET  /api/v1/users/:id/followers
// GET  /api/v1/users/:id/following

usersRouter.get('/me',              (_req, res) => res.json({ todo: 'getMe' }));
usersRouter.patch('/me',            (_req, res) => res.json({ todo: 'updateMe' }));
usersRouter.get('/:id',             (_req, res) => res.json({ todo: 'getProfile' }));
usersRouter.post('/:id/follow',     (_req, res) => res.json({ todo: 'toggleFollow' }));
usersRouter.get('/:id/followers',   (_req, res) => res.json({ todo: 'getFollowers' }));
usersRouter.get('/:id/following',   (_req, res) => res.json({ todo: 'getFollowing' }));
