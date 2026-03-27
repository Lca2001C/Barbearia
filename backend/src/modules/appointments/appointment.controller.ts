import { Request, Response } from 'express';
import * as appointmentService from './appointment.service';
import { AppError } from '../../shared/errors/AppError';

function getParam(value: string | string[] | undefined, name: string) {
  const normalized = Array.isArray(value) ? value[0] : value;
  if (!normalized) {
    throw new AppError(`Parâmetro ${name} é obrigatório`, 400);
  }
  return normalized;
}

export async function createAppointmentHandler(req: Request, res: Response) {
  const appointment = await appointmentService.createAppointment(req.user!.id, req.body);
  return res.status(201).json({ data: appointment });
}

export async function listAppointmentsHandler(req: Request, res: Response) {
  const appointments = await appointmentService.listAppointments(req.user!.id, req.user!.role);
  return res.json({ data: appointments });
}

export async function getAppointmentHandler(req: Request, res: Response) {
  const appointmentId = getParam(req.params.id, 'id');
  const appointment = await appointmentService.getAppointment(appointmentId, req.user!.id, req.user!.role);
  return res.json({ data: appointment });
}

export async function cancelAppointmentHandler(req: Request, res: Response) {
  const appointmentId = getParam(req.params.id, 'id');
  const appointment = await appointmentService.cancelAppointment(appointmentId, req.user!.id, req.user!.role);
  return res.json({ data: appointment });
}

export async function completeAppointmentHandler(req: Request, res: Response) {
  const appointmentId = getParam(req.params.id, 'id');
  const appointment = await appointmentService.completeAppointment(appointmentId);
  return res.json({ data: appointment });
}

export async function getUpcomingHandler(_req: Request, res: Response) {
  const appointments = await appointmentService.getUpcoming();
  return res.json({ data: appointments });
}

export async function getTodayAppointmentsHandler(req: Request, res: Response) {
  const appointments = await appointmentService.getTodayAppointments({
    startDate: typeof req.query.startDate === 'string' ? req.query.startDate : undefined,
    endDate: typeof req.query.endDate === 'string' ? req.query.endDate : undefined,
  });
  return res.json({ data: appointments });
}

export async function getWeekAppointmentsHandler(req: Request, res: Response) {
  const appointments = await appointmentService.getWeekAppointments({
    startDate: typeof req.query.startDate === 'string' ? req.query.startDate : undefined,
    endDate: typeof req.query.endDate === 'string' ? req.query.endDate : undefined,
  });
  return res.json({ data: appointments });
}
