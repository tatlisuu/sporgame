import { Request, Response, NextFunction } from 'express';
import * as matchmakingService from './matchmaking.service';
import { sendSuccess, sendCreated } from '../../shared/utils/response';

export async function createChallenge(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const match = await matchmakingService.createChallenge(req.user!.sub, req.body);
    sendCreated(res, match, 'Challenge sent');
  } catch (err) { next(err); }
}

export async function respondToChallenge(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const match = await matchmakingService.respondToChallenge(req.params.id, req.user!.sub, req.body);
    sendSuccess(res, match);
  } catch (err) { next(err); }
}

export async function reportResult(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const match = await matchmakingService.reportResult(req.params.id, req.user!.sub, req.body);
    sendSuccess(res, match);
  } catch (err) { next(err); }
}

export async function listChallenges(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const matches = await matchmakingService.listChallenges(req.user!.sub);
    sendSuccess(res, matches);
  } catch (err) { next(err); }
}

export async function getLeaderboard(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const entries = await matchmakingService.getLeaderboard(req.params.sport);
    sendSuccess(res, entries);
  } catch (err) { next(err); }
}
