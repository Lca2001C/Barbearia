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

export async function getTodayAppointmentsHandler(req: Request, res: Response) {
  // #region agent log
  fetch('http://127.0.0.1:7772/ingest/efa8c094-3985-4d28-bcde-0c4cf7f1376c',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'ff99de'},body:JSON.stringify({sessionId:'ff99de',runId:'initial',hypothesisId:'H3',location:'backend/src/modules/appointments/appointment.controller.ts:getTodayAppointmentsHandler',message:'Today appointments endpoint hit',data:{hasUser:!!req.user,startDate:typeof req.query.startDate==='string',endDate:typeof req.query.endDate==='string'},timestamp:Date.now()})}).catch(()=>{})
  // #endregion
  const appointments = await appointmentService.getTodayAppointments({
    startDate: typeof req.query.startDate === 'string' ? req.query.startDate : undefined,
    endDate: typeof req.query.endDate === 'string' ? req.query.endDate : undefined,
  });
  return res.json({ data: appointments });
}

export async function getWeekAppointmentsHandler(req: Request, res: Response) {
  // #region agent log
  fetch('http://127.0.0.1:7772/ingest/efa8c094-3985-4d28-bcde-0c4cf7f1376c',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'ff99de'},body:JSON.stringify({sessionId:'ff99de',runId:'initial',hypothesisId:'H3',location:'backend/src/modules/appointments/appointment.controller.ts:getWeekAppointmentsHandler',message:'Week appointments endpoint hit',data:{hasUser:!!req.user,startDate:typeof req.query.startDate==='string',endDate:typeof req.query.endDate==='string'},timestamp:Date.now()})}).catch(()=>{})
  // #endregion
  const appointments = await appointmentService.getWeekAppointments({
    startDate: typeof req.query.startDate === 'string' ? req.query.startDate : undefined,
    endDate: typeof req.query.endDate === 'string' ? req.query.endDate : undefined,
  });
  return res.json({ data: appointments });
}
