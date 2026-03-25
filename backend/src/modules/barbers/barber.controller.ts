import { Request, Response } from 'express';
import * as barberService from './barber.service';

export async function listBarbersHandler(_req: Request, res: Response) {
  const barbers = await barberService.listBarbers();
  return res.json({ data: barbers });
}

export async function getBarberHandler(req: Request, res: Response) {
  const barber = await barberService.getBarber(req.params.id);
  return res.json({ data: barber });
}

export async function createBarberHandler(req: Request, res: Response) {
  const barber = await barberService.createBarber(req.body);
  return res.status(201).json({ data: barber });
}

export async function updateBarberHandler(req: Request, res: Response) {
  const barber = await barberService.updateBarber(req.params.id, req.body);
  return res.json({ data: barber });
}

export async function deleteBarberHandler(req: Request, res: Response) {
  await barberService.deleteBarber(req.params.id);
  return res.status(204).send();
}

export async function setWorkingHoursHandler(req: Request, res: Response) {
  const hours = await barberService.setWorkingHours(req.params.id, req.body.hours);
  return res.json({ data: hours });
}

export async function getAvailabilityHandler(req: Request, res: Response) {
  const { date, serviceId } = req.query as { date: string; serviceId: string };
  const slots = await barberService.getAvailability(req.params.id, date, serviceId);
  return res.json({ data: slots });
}
