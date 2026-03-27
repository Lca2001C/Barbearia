import { Request, Response } from 'express';
import * as userService from './user.service';

export async function getProfileHandler(req: Request, res: Response) {
  const user = await userService.getProfile(req.user!.id);
  return res.json({ data: user });
}

export async function updateProfileHandler(req: Request, res: Response) {
  const user = await userService.updateProfile(req.user!.id, req.body);
  return res.json({ data: user });
}

export async function listUsersHandler(_req: Request, res: Response) {
  const users = await userService.listUsers();
  return res.json({ data: users });
}
