import { Request, Response } from 'express';
import * as authService from './auth.service';

export async function registerHandler(req: Request, res: Response) {
  const result = await authService.register(req.body);
  return res.status(201).json({ data: result });
}

export async function loginHandler(req: Request, res: Response) {
  const result = await authService.login(req.body);
  return res.json({ data: result });
}

export async function refreshHandler(req: Request, res: Response) {
  const { refreshToken } = req.body;
  const result = await authService.refreshToken(refreshToken);
  return res.json({ data: result });
}
