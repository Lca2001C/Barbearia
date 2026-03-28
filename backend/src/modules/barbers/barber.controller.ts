import { Request, Response } from 'express';
import * as barberService from './barber.service';
import { AppError } from '../../shared/errors/AppError';

function getParam(value: string | string[] | undefined, name: string) {
  const normalized = Array.isArray(value) ? value[0] : value;
  if (!normalized) {
    throw new AppError(`Parâmetro ${name} é obrigatório`, 400);
  }
  return normalized;
}

export async function listBarbersHandler(req: Request, res: Response) {
  const viewer = req.user
    ? { role: req.user.role, managedBarberId: req.user.managedBarberId ?? null }
    : undefined;
  const barbers = await barberService.listBarbers(viewer);
  return res.json({ data: barbers });
}

export async function getBarberHandler(req: Request, res: Response) {
  const barberId = getParam(req.params.id, 'id');
  const barber = await barberService.getBarber(barberId);
  return res.json({ data: barber });
}

export async function createBarberHandler(req: Request, res: Response) {
  const barber = await barberService.createBarber(req.body);
  return res.status(201).json({ data: barber });
}

export async function updateBarberHandler(req: Request, res: Response) {
  const barberId = getParam(req.params.id, 'id');
  const barber = await barberService.updateBarber(barberId, req.body);
  return res.json({ data: barber });
}

export async function deleteBarberHandler(req: Request, res: Response) {
  const barberId = getParam(req.params.id, 'id');
  await barberService.deleteBarber(barberId);
  return res.status(204).send();
}

export async function setWorkingHoursHandler(req: Request, res: Response) {
  const barberId = getParam(req.params.id, 'id');
  const hours = await barberService.setWorkingHours(barberId, req.body.hours);
  return res.json({ data: hours });
}

export async function getAvailabilityHandler(req: Request, res: Response) {
  const { date, serviceId } = req.query as { date: string; serviceId: string };
  const barberId = getParam(req.params.id, 'id');
  const slots = await barberService.getAvailability(barberId, date, serviceId);
  return res.json({ data: slots });
}

export async function getBarbersMetricsOverviewHandler(req: Request, res: Response) {
  const scopeBarberId =
    req.user!.role === 'SUB_ADMIN' ? req.user!.managedBarberId ?? undefined : undefined;
  const rows = await barberService.getBarbersMetricsOverview(scopeBarberId);
  return res.json({ data: rows });
}

export async function getBarberHistoryHandler(req: Request, res: Response) {
  const barberId = getParam(req.params.id, 'id');
  const order = req.query.order === 'asc' ? 'asc' : 'desc';
  const viewer = req.user
    ? { role: req.user.role, managedBarberId: req.user.managedBarberId ?? null }
    : undefined;
  const history = await barberService.getBarberHistory(barberId, order, viewer);
  return res.json({ data: history });
}
