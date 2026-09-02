import { Router } from 'express';
import { authRouter }        from '../features/auth/auth.routes';
import { usersRouter }       from '../features/users/users.routes';
import { activitiesRouter }  from '../features/activities/activities.routes';
import { matchmakingRouter } from '../features/matchmaking/matchmaking.routes';
import { feedRouter }        from '../features/feed/feed.routes';

export const apiRouter = Router();

apiRouter.use('/auth',        authRouter);
apiRouter.use('/users',       usersRouter);
apiRouter.use('/activities',  activitiesRouter);
apiRouter.use('/matchmaking', matchmakingRouter);
apiRouter.use('/feed',        feedRouter);
