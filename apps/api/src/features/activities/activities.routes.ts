import { Router } from 'express';
import { authenticate } from '../../shared/middleware/authenticate.middleware';
import { validate } from '../../shared/middleware/validate.middleware';
import { createActivitySchema, paginationQuerySchema } from './activities.dto';
import * as activitiesController from './activities.controller';

export const activitiesRouter = Router();

activitiesRouter.use(authenticate);

activitiesRouter.post('/', validate(createActivitySchema, 'body'), activitiesController.create);
activitiesRouter.get('/', validate(paginationQuerySchema, 'query'), activitiesController.getFeed);
activitiesRouter.get('/feed', validate(paginationQuerySchema, 'query'), activitiesController.getFeed);
activitiesRouter.post('/:id/like', activitiesController.toggleLike);
activitiesRouter.get('/:id/comments', activitiesController.getComments);
activitiesRouter.post('/:id/comments', activitiesController.addComment);
activitiesRouter.delete('/:id', activitiesController.remove);
