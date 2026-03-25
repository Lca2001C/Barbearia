import { Request, Response } from 'express';
import * as serviceService from './service.service';

export async function listServicesHandler(req: Request, res: Response) {
  const isAdmin = req.user?.role === 'ADMIN';
  const services = await serviceService.listServices(isAdmin);
  return res.json({ data: services });
}

export async function getServiceHandler(req: Request, res: Response) {
  const service = await serviceService.getService(req.params.id);
  return res.json({ data: service });
}

export async function createServiceHandler(req: Request, res: Response) {
  const service = await serviceService.createService(req.body);
  return res.status(201).json({ data: service });
}

export async function updateServiceHandler(req: Request, res: Response) {
  const service = await serviceService.updateService(req.params.id, req.body);
  return res.json({ data: service });
}

export async function deleteServiceHandler(req: Request, res: Response) {
  await serviceService.deleteService(req.params.id);
  return res.status(204).send();
}
