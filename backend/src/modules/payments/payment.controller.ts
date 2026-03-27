import { Request, Response } from 'express';
import * as paymentService from './payment.service';
import { AppError } from '../../shared/errors/AppError';

function getParam(value: string | string[] | undefined, name: string) {
  const normalized = Array.isArray(value) ? value[0] : value;
  if (!normalized) {
    throw new AppError(`Parâmetro ${name} é obrigatório`, 400);
  }
  return normalized;
}

export async function generatePixHandler(req: Request, res: Response) {
  const payment = await paymentService.generatePix(req.body.appointmentId, req.user!.id);
  return res.status(201).json({ data: payment });
}

export async function webhookHandler(req: Request, res: Response) {
  await paymentService.handleWebhook(req.body);
  return res.status(200).send();
}

export async function getPaymentStatusHandler(req: Request, res: Response) {
  const paymentId = getParam(req.params.id, 'id');
  const payment = await paymentService.getPaymentStatus(paymentId, req.user!.id, req.user!.role);
  return res.json({ data: payment });
}
