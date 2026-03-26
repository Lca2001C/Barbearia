import { Request, Response } from 'express';
import * as appointmentService from './appointment.service';

export async function createAppointmentHandler(req: Request, res: Response) {
  const appointment = await appointmentService.createAppointment(req.user!.id, req.body);
  return res.status(201).json({ data: appointment });
}

export async function listAppointmentsHandler(req: Request, res: Response) {
  const appointments = await appointmentService.listAppointments(req.user!.id, req.user!.role);
  return res.json({ data: appointments });
}

export async function getAppointmentHandler(req: Request, res: Response) {
  const appointment = await appointmentService.getAppointment(req.params.id, req.user!.id, req.user!.role);
  return res.json({ data: appointment });
}

export async function cancelAppointmentHandler(req: Request, res: Response) {
  const appointment = await appointmentService.cancelAppointment(req.params.id, req.user!.id, req.user!.role);
  return res.json({ data: appointment });
}

export async function completeAppointmentHandler(req: Request, res: Response) {
  const appointment = await appointmentService.completeAppointment(req.params.id);
  return res.json({ data: appointment });
}

export async function getUpcomingHandler(_req: Request, res: Response) {
  const appointments = await appointmentService.getUpcoming();
  return res.json({ data: appointments });
}

export async function getTodayAppointmentsHandler(_req: Request, res: Response) {
  const appointments = await appointmentService.getTodayAppointments();
  return res.json({ data: appointments });
}

export async function getWeekAppointmentsHandler(_req: Request, res: Response) {
  const appointments = await appointmentService.getWeekAppointments();
  return res.json({ data: appointments });
}
