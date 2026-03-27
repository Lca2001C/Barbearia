import { Request, Response } from 'express';
import { AppError } from '../../shared/errors/AppError';
import * as barberService from './barber.service';

function getParamId(req: Request) {
  return Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
}

export async function listBarbersHandler(req: Request, res: Response) {
  const barbers = await barberService.listBarbers(req.user);
  return res.json({ data: barbers });
}

export async function getBarberHandler(req: Request, res: Response) {
  const id = getParamId(req);
  const u = req.user;
  if (u?.role === 'SUB_ADMIN' && u.managedBarberId && id !== u.managedBarberId) {
    throw new AppError('Acesso não autorizado', 403);
  }
  const barber = await barberService.getBarber(id);
  return res.json({ data: barber });
}

export async function createBarberHandler(req: Request, res: Response) {
  const barber = await barberService.createBarber(req.body);
  return res.status(201).json({ data: barber });
}

export async function updateBarberHandler(req: Request, res: Response) {
  const barber = await barberService.updateBarber(getParamId(req), req.body);
  return res.json({ data: barber });
}

export async function deleteBarberHandler(req: Request, res: Response) {
  await barberService.deleteBarber(getParamId(req));
  return res.status(204).send();
}

export async function setWorkingHoursHandler(req: Request, res: Response) {
  const hours = await barberService.setWorkingHours(getParamId(req), req.body.hours);
  return res.json({ data: hours });
}

export async function getAvailabilityHandler(req: Request, res: Response) {
  const id = getParamId(req);
  const u = req.user;
  if (u?.role === 'SUB_ADMIN' && u.managedBarberId && id !== u.managedBarberId) {
    throw new AppError('Acesso não autorizado', 403);
  }
  const { date, serviceId } = req.query as { date: string; serviceId: string };
  const slots = await barberService.getAvailability(id, date, serviceId);
  return res.json({ data: slots });
}

export async function getBarbersMetricsOverviewHandler(req: Request, res: Response) {
  const scope =
    req.user!.role === 'SUB_ADMIN' ? req.user!.managedBarberId ?? undefined : undefined;
  if (req.user!.role === 'SUB_ADMIN' && !scope) {
    throw new AppError('Sub-admin sem barbeiro vinculado', 403);
  }
  const rows = await barberService.getBarbersMetricsOverview(scope);
  return res.json({ data: rows });
}

export async function getBarberHistoryHandler(req: Request, res: Response) {
  const order =
    (req.query.order === 'asc' || req.query.order === 'desc'
      ? req.query.order
      : 'desc') as 'asc' | 'desc';
  const rows = await barberService.getBarberHistory(getParamId(req), order, req.user);
  return res.json({ data: rows });
}
