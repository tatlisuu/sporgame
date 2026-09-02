import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../../shared/middleware/authenticate.middleware';
import * as usersService from './users.service';
import { sendSuccess } from '../../shared/utils/response';

export const usersRouter = Router();

usersRouter.use(authenticate);

// GET  /api/v1/users/me — get own profile
usersRouter.get('/me', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profile = await usersService.getUserProfile(req.user!.sub, req.user!.sub);
    sendSuccess(res, profile);
  } catch (err) {
    next(err);
  }
});

// GET  /api/v1/users/:id — get public user profile with recent activities
usersRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profile = await usersService.getUserProfile(req.params.id, req.user?.sub);
    sendSuccess(res, profile);
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/users/:id/follow — follow or unfollow
usersRouter.post('/:id/follow', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await usersService.toggleFollow(req.params.id, req.user!.sub);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
});
