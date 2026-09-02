import { Router } from 'express';
import { authenticate } from '../../shared/middleware/authenticate.middleware';
import { validate }     from '../../shared/middleware/validate.middleware';
import {
  createChallengeSchema,
  respondChallengeSchema,
  reportResultSchema,
} from './matchmaking.dto';
import * as ctrl from './matchmaking.controller';

export const matchmakingRouter = Router();

matchmakingRouter.use(authenticate);

matchmakingRouter.post('/challenge',          validate(createChallengeSchema),   ctrl.createChallenge);
matchmakingRouter.get('/challenges',                                             ctrl.listChallenges);
matchmakingRouter.patch('/:id/respond',       validate(respondChallengeSchema),  ctrl.respondToChallenge);
matchmakingRouter.patch('/:id/result',        validate(reportResultSchema),      ctrl.reportResult);
matchmakingRouter.get('/leaderboard/:sport',                                     ctrl.getLeaderboard);
