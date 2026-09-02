import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { AppError } from '../errors/AppError';
import { HTTP_STATUS } from '@sporgame/shared';

type RequestPart = 'body' | 'query' | 'params';

export function validate(schema: AnyZodObject, part: RequestPart = 'body') {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      // parseAsync strips unknown keys on schemas without .strict(),
      // and rejects unknown keys on schemas with .strict() — both prevent mass assignment
      req[part] = await schema.parseAsync(req[part]);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const message = err.errors
          .map((e) => `${e.path.join('.')}: ${e.message}`)
          .join('; ');
        next(new AppError(HTTP_STATUS.UNPROCESSABLE_ENTITY, message, 'VALIDATION_ERROR'));
      } else {
        next(err);
      }
    }
  };
}
