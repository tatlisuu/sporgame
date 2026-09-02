import { Request, Response, NextFunction } from 'express';
import * as activitiesService from './activities.service';
import { sendSuccess, sendCreated, sendNoContent } from '../../shared/utils/response';
import type { PaginationQueryDto } from './activities.dto';

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const activity = await activitiesService.createActivity(req.user!.sub, req.body);
    sendCreated(res, activity, 'Activity created successfully');
  } catch (err) {
    next(err);
  }
}

export async function getFeed(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const query = req.query as unknown as PaginationQueryDto;
    const feed = await activitiesService.getFeed(query, req.user!.sub);
    sendSuccess(res, feed);
  } catch (err) {
    next(err);
  }
}

export async function toggleLike(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await activitiesService.toggleLike(req.params.id, req.user!.sub);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await activitiesService.deleteActivity(req.params.id, req.user!.sub);
    sendNoContent(res);
  } catch (err) {
    next(err);
  }
}
