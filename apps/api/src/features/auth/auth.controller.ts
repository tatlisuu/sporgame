import { Request, Response, NextFunction } from 'express';
import * as authService from './auth.service';
import { sendSuccess, sendCreated, sendNoContent } from '../../shared/utils/response';

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { tokens, user } = await authService.registerUser(req.body);
    sendCreated(res, { ...tokens, user }, 'Account created');
  } catch (err) { next(err); }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { tokens, user } = await authService.loginUser(req.body);
    sendSuccess(res, { ...tokens, user });
  } catch (err) { next(err); }
}

export async function refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tokens = await authService.refreshAccessToken(req.body.refreshToken as string);
    sendSuccess(res, tokens);
  } catch (err) { next(err); }
}

export async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await authService.logoutUser(req.user!.sub);
    sendNoContent(res);
  } catch (err) { next(err); }
}
