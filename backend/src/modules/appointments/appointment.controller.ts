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

/** Barbeiro fixo para SUB_ADMIN; ADMIN não restringe. */
function scopeBarberForStaff(req: Request): string | null | undefined {
  if (req.user!.role !== 'SUB_ADMIN') {
    return undefined;
  }
  return req.user!.managedBarberId;
}

function scopeForAdminMutation(req: Request): string | null | undefined {
  return req.user!.role === 'SUB_ADMIN' ? req.user!.managedBarberId ?? null : undefined;
}

export async function createAppointmentHandler(req: Request, res: Response) {
  const appointment = await appointmentService.createAppointment(req.user!.id, req.body);
  return res.status(201).json({ data: appointment });
}

export async function createAppointmentByAdminHandler(req: Request, res: Response) {
  const appointment = await appointmentService.createAppointmentByAdmin(
    req.body,
    scopeForAdminMutation(req),
  );
  return res.status(201).json({ data: appointment });
}

export async function listAppointmentsHandler(req: Request, res: Response) {
  const appointments = await appointmentService.listAppointments(
    req.user!.id,
    req.user!.role,
    req.user!.managedBarberId,
  );
  return res.json({ data: appointments });
}

export async function getAppointmentHandler(req: Request, res: Response) {
  const appointmentId = getParam(req.params.id, 'id');
  const appointment = await appointmentService.getAppointment(
    appointmentId,
    req.user!.id,
    req.user!.role,
    req.user!.managedBarberId,
  );
  return res.json({ data: appointment });
}

export async function cancelAppointmentHandler(req: Request, res: Response) {
  const appointmentId = getParam(req.params.id, 'id');
  const appointment = await appointmentService.cancelAppointment(
    appointmentId,
    req.user!.id,
    req.user!.role,
    req.user!.managedBarberId,
  );
  return res.json({ data: appointment });
}

export async function completeAppointmentHandler(req: Request, res: Response) {
  const appointmentId = getParam(req.params.id, 'id');
  const scope =
    req.user!.role === 'SUB_ADMIN' ? req.user!.managedBarberId ?? undefined : undefined;
  if (req.user!.role === 'SUB_ADMIN' && !scope) {
    throw new AppError('Acesso não autorizado', 403);
  }
  const appointment = await appointmentService.completeAppointment(appointmentId, scope);
  return res.json({ data: appointment });
}

export async function getUpcomingHandler(req: Request, res: Response) {
  const scope = scopeBarberForStaff(req);
  if (req.user!.role === 'SUB_ADMIN' && !scope) {
    return res.json({ data: [] });
  }
  const appointments = await appointmentService.getUpcoming(scope ?? undefined);
  return res.json({ data: appointments });
}

export async function getTodayAppointmentsHandler(req: Request, res: Response) {
  const scope = scopeBarberForStaff(req);
  if (req.user!.role === 'SUB_ADMIN' && !scope) {
    return res.json({ data: [] });
  }
  const appointments = await appointmentService.getTodayAppointments(
    {
      startDate: typeof req.query.startDate === 'string' ? req.query.startDate : undefined,
      endDate: typeof req.query.endDate === 'string' ? req.query.endDate : undefined,
    },
    scope ?? undefined,
  );
  return res.json({ data: appointments });
}

export async function getWeekAppointmentsHandler(req: Request, res: Response) {
  const scope = scopeBarberForStaff(req);
  if (req.user!.role === 'SUB_ADMIN' && !scope) {
    return res.json({ data: [] });
  }
  const appointments = await appointmentService.getWeekAppointments(
    {
      startDate: typeof req.query.startDate === 'string' ? req.query.startDate : undefined,
      endDate: typeof req.query.endDate === 'string' ? req.query.endDate : undefined,
    },
    scope ?? undefined,
  );
  return res.json({ data: appointments });
}

export async function updateAppointmentByAdminHandler(req: Request, res: Response) {
  const appointmentId = getParam(req.params.id, 'id');
  const appointment = await appointmentService.updateAppointmentByAdmin(
    appointmentId,
    req.body,
    scopeForAdminMutation(req),
  );
  return res.json({ data: appointment });
}

export async function deleteAppointmentByAdminHandler(req: Request, res: Response) {
  const appointmentId = getParam(req.params.id, 'id');
  await appointmentService.deleteAppointmentByAdmin(appointmentId, scopeForAdminMutation(req));
  return res.status(204).send();
}
