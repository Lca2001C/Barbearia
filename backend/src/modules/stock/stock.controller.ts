import { Request, Response } from 'express';
import { AppError } from '../../shared/errors/AppError';
import * as stockService from './stock.service';

function assertSubAdminBarber(req: Request, barberId: string) {
  if (req.user!.role === 'SUB_ADMIN' && req.user!.managedBarberId !== barberId) {
    throw new AppError('Acesso não autorizado', 403);
  }
}

function staff(req: Request) {
  return { role: req.user!.role, managedBarberId: req.user!.managedBarberId };
}

export async function listByBarberHandler(req: Request, res: Response) {
  const barberId = String(req.params.barberId);
  assertSubAdminBarber(req, barberId);
  const items = await stockService.listByBarber(barberId);
  return res.json({ data: items });
}

export async function createItemHandler(req: Request, res: Response) {
  const barberId = String(req.params.barberId);
  assertSubAdminBarber(req, barberId);
  const item = await stockService.createItem(barberId, req.body);
  return res.status(201).json({ data: item });
}

export async function updateItemHandler(req: Request, res: Response) {
  const id = String(req.params.id);
  const item = await stockService.updateItem(id, req.body, staff(req));
  return res.json({ data: item });
}

export async function deleteItemHandler(req: Request, res: Response) {
  const id = String(req.params.id);
  await stockService.deleteItem(id, staff(req));
  return res.status(204).send();
}
