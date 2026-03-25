import { Request, Response } from 'express';
import * as stockService from './stock.service';

export async function listByBarberHandler(req: Request, res: Response) {
  const { barberId } = req.params;
  const items = await stockService.listByBarber(barberId);
  return res.json({ data: items });
}

export async function createItemHandler(req: Request, res: Response) {
  const { barberId } = req.params;
  const item = await stockService.createItem(barberId, req.body);
  return res.status(201).json({ data: item });
}

export async function updateItemHandler(req: Request, res: Response) {
  const { id } = req.params;
  const item = await stockService.updateItem(id, req.body);
  return res.json({ data: item });
}

export async function deleteItemHandler(req: Request, res: Response) {
  const { id } = req.params;
  await stockService.deleteItem(id);
  return res.status(204).send();
}
