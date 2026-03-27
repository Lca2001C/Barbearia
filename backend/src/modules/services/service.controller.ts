import { Request, Response } from 'express';
import * as serviceService from './service.service';
import { AppError } from '../../shared/errors/AppError';

function getParam(value: string | string[] | undefined, name: string) {
  const normalized = Array.isArray(value) ? value[0] : value;
  if (!normalized) {
    throw new AppError(`Parâmetro ${name} é obrigatório`, 400);
  }
  return normalized;
}

export async function listServicesHandler(req: Request, res: Response) {
  const isAdmin = req.user?.role === 'ADMIN';
  const services = await serviceService.listServices(isAdmin);
  return res.json({ data: services });
}

export async function getServiceHandler(req: Request, res: Response) {
  const serviceId = getParam(req.params.id, 'id');
  const service = await serviceService.getService(serviceId);
  return res.json({ data: service });
}

export async function createServiceHandler(req: Request, res: Response) {
  const service = await serviceService.createService(req.body);
  return res.status(201).json({ data: service });
}

export async function updateServiceHandler(req: Request, res: Response) {
  const serviceId = getParam(req.params.id, 'id');
  const service = await serviceService.updateService(serviceId, req.body);
  return res.json({ data: service });
}

export async function deleteServiceHandler(req: Request, res: Response) {
  const serviceId = getParam(req.params.id, 'id');
  await serviceService.deleteService(serviceId);
  return res.status(204).send();
}
