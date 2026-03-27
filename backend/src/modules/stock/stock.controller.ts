import { Request, Response } from 'express';
import * as stockService from './stock.service';
import { AppError } from '../../shared/errors/AppError';

function getParam(value: string | string[] | undefined, name: string) {
  const normalized = Array.isArray(value) ? value[0] : value;
  if (!normalized) {
    throw new AppError(`Parâmetro ${name} é obrigatório`, 400);
  }
  return normalized;
}

export async function listByBarberHandler(req: Request, res: Response) {
  const barberId = getParam(req.params.barberId, 'barberId');
  const items = await stockService.listByBarber(barberId);
  return res.json({ data: items });
}

export async function createItemHandler(req: Request, res: Response) {
  const barberId = getParam(req.params.barberId, 'barberId');
  const item = await stockService.createItem(barberId, req.body);
  return res.status(201).json({ data: item });
}

export async function updateItemHandler(req: Request, res: Response) {
  const id = getParam(req.params.id, 'id');
  const item = await stockService.updateItem(id, req.body);
  return res.json({ data: item });
}

export async function deleteItemHandler(req: Request, res: Response) {
  const id = getParam(req.params.id, 'id');
  await stockService.deleteItem(id);
  return res.status(204).send();
}
