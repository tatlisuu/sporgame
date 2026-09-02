import { Router } from 'express';
import { authenticate } from '../../shared/middleware/authenticate.middleware';
import { validate } from '../../shared/middleware/validate.middleware';
import { createActivitySchema, paginationQuerySchema } from './activities.dto';
import * as activitiesController from './activities.controller';

export const activitiesRouter = Router();

activitiesRouter.use(authenticate);

activitiesRouter.post('/', validate(createActivitySchema, 'body'), activitiesController.create);
activitiesRouter.get('/feed', validate(paginationQuerySchema, 'query'), activitiesController.getFeed);
activitiesRouter.post('/:id/like', activitiesController.toggleLike);
activitiesRouter.delete('/:id', activitiesController.remove);
