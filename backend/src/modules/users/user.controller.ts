import { Request, Response } from 'express';
import { z } from 'zod';
import * as userService from './user.service';

export async function getProfileHandler(req: Request, res: Response) {
  const user = await userService.getProfile(req.user!.id);
  return res.json({ data: user });
}

export async function updateProfileHandler(req: Request, res: Response) {
  const user = await userService.updateProfile(req.user!.id, req.body);
  return res.json({ data: user });
}

export async function changePasswordHandler(req: Request, res: Response) {
  await userService.changePassword(req.user!.id, req.body);
  return res.json({ data: { success: true } });
}

export async function listClientsForStaffHandler(_req: Request, res: Response) {
  const users = await userService.listClientsForStaff();
  return res.json({ data: users });
}

export async function listUsersHandler(_req: Request, res: Response) {
  const users = await userService.listUsers();
  return res.json({ data: users });
}

export async function updateUserRoleHandler(req: Request, res: Response) {
  const id = z.string().uuid().parse(req.params.id);
  const user = await userService.updateUserRoleByAdmin(id, req.body);
  return res.json({ data: user });
}

export async function getUserDetailsHandler(req: Request, res: Response) {
  const id = z.string().uuid().parse(req.params.id);
  const user = await userService.getUserDetailsByAdmin(id);
  return res.json({ data: user });
}

export async function deleteUserHandler(req: Request, res: Response) {
  const id = z.string().uuid().parse(req.params.id);
  await userService.deleteUserByAdmin(id);
  return res.status(204).send();
}
