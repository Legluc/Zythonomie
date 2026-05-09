import { Request, Response } from 'express';
import * as authService from '../services/auth.service';
import { sendSuccess } from '../lib/response';

export async function registerHandler(req: Request, res: Response): Promise<void> {
  const tokens = await authService.register(req.body);
  sendSuccess(res, 201, tokens);
}

export async function loginHandler(req: Request, res: Response): Promise<void> {
  const tokens = await authService.login(req.body);
  sendSuccess(res, 200, tokens);
}

export async function refreshHandler(req: Request, res: Response): Promise<void> {
  const { refreshToken } = req.body as { refreshToken: string };
  const tokens = await authService.refresh(refreshToken);
  sendSuccess(res, 200, tokens);
}

export async function getMeHandler(req: Request, res: Response): Promise<void> {
  const userId = req.user!.id;
  const user = await authService.getMe(userId);
  sendSuccess(res, 200, user);
}

export async function logoutHandler(req: Request, res: Response): Promise<void> {
  const { refreshToken } = req.body as { refreshToken: string };
  await authService.logout(refreshToken);
  sendSuccess(res, 200, { message: 'Déconnexion réussie' });
}
