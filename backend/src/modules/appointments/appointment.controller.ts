import { Request, Response } from 'express';
import { AppError } from '../../shared/errors/AppError';
import * as appointmentService from './appointment.service';

function getParamId(req: Request) {
  return Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
}

function staffFromReq(req: Request): appointmentService.StaffContext {
  return {
    role: req.user!.role,
    managedBarberId: req.user!.managedBarberId,
  };
}

export async function createAppointmentHandler(req: Request, res: Response) {
  const appointment = await appointmentService.createAppointment(req.user!.id, req.body);
  return res.status(201).json({ data: appointment });
}

export async function createAppointmentByAdminHandler(req: Request, res: Response) {
  const u = req.user!;
  if (u.role === 'SUB_ADMIN') {
    if (!u.managedBarberId || req.body.barberId !== u.managedBarberId) {
      throw new AppError('Acesso não autorizado', 403);
    }
  }
  const appointment = await appointmentService.createAppointmentByAdmin(req.body);
  return res.status(201).json({ data: appointment });
}

export async function listAppointmentsHandler(req: Request, res: Response) {
  const u = req.user!;
  const appointments = await appointmentService.listAppointments(
    u.id,
    u.role,
    u.managedBarberId,
  );
  return res.json({ data: appointments });
}

export async function getAppointmentHandler(req: Request, res: Response) {
  const u = req.user!;
  const appointment = await appointmentService.getAppointment(
    getParamId(req),
    u.id,
    u.role,
    u.managedBarberId,
  );
  return res.json({ data: appointment });
}

export async function cancelAppointmentHandler(req: Request, res: Response) {
  const u = req.user!;
  const appointment = await appointmentService.cancelAppointment(
    getParamId(req),
    u.id,
    u.role,
    u.managedBarberId,
  );
  return res.json({ data: appointment });
}

export async function completeAppointmentHandler(req: Request, res: Response) {
  const appointment = await appointmentService.completeAppointment(
    getParamId(req),
    staffFromReq(req),
  );
  return res.json({ data: appointment });
}

export async function updateAppointmentByAdminHandler(req: Request, res: Response) {
  const appointment = await appointmentService.updateAppointmentByAdmin(
    getParamId(req),
    req.body,
    staffFromReq(req),
  );
  return res.json({ data: appointment });
}

export async function deleteAppointmentByAdminHandler(req: Request, res: Response) {
  await appointmentService.deleteAppointmentByAdmin(getParamId(req), staffFromReq(req));
  return res.status(204).send();
}

export async function getUpcomingHandler(req: Request, res: Response) {
  const barberId =
    req.user!.role === 'SUB_ADMIN' ? req.user!.managedBarberId ?? undefined : undefined;
  if (req.user!.role === 'SUB_ADMIN' && !barberId) {
    throw new AppError('Sub-admin sem barbeiro vinculado', 403);
  }
  const appointments = await appointmentService.getUpcoming(barberId);
  return res.json({ data: appointments });
}

export async function getTodayAppointmentsHandler(req: Request, res: Response) {
  const barberId =
    req.user!.role === 'SUB_ADMIN' ? req.user!.managedBarberId ?? undefined : undefined;
  if (req.user!.role === 'SUB_ADMIN' && !barberId) {
    throw new AppError('Sub-admin sem barbeiro vinculado', 403);
  }
  const appointments = await appointmentService.getTodayAppointments({
    startDate: typeof req.query.startDate === 'string' ? req.query.startDate : undefined,
    endDate: typeof req.query.endDate === 'string' ? req.query.endDate : undefined,
    barberId,
  });
  return res.json({ data: appointments });
}

export async function getWeekAppointmentsHandler(req: Request, res: Response) {
  const barberId =
    req.user!.role === 'SUB_ADMIN' ? req.user!.managedBarberId ?? undefined : undefined;
  if (req.user!.role === 'SUB_ADMIN' && !barberId) {
    throw new AppError('Sub-admin sem barbeiro vinculado', 403);
  }
  const appointments = await appointmentService.getWeekAppointments({
    startDate: typeof req.query.startDate === 'string' ? req.query.startDate : undefined,
    endDate: typeof req.query.endDate === 'string' ? req.query.endDate : undefined,
    barberId,
  });
  return res.json({ data: appointments });
}
