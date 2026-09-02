import { Response } from 'express';
import { HTTP_STATUS } from '@sporgame/shared';

export function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode: number = HTTP_STATUS.OK,
  message?: string,
): Response {
  return res.status(statusCode).json({ success: true, data, message });
}

export function sendCreated<T>(res: Response, data: T, message?: string): Response {
  return sendSuccess(res, data, HTTP_STATUS.CREATED, message);
}

export function sendNoContent(res: Response): Response {
  return res.status(HTTP_STATUS.NO_CONTENT).send();
}
