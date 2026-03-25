import { Request, Response } from 'express';
import * as paymentService from './payment.service';

export async function generatePixHandler(req: Request, res: Response) {
  const payment = await paymentService.generatePix(req.body.appointmentId, req.user!.id);
  return res.status(201).json({ data: payment });
}

export async function webhookHandler(req: Request, res: Response) {
  await paymentService.handleWebhook(req.body);
  return res.status(200).send();
}

export async function getPaymentStatusHandler(req: Request, res: Response) {
  const payment = await paymentService.getPaymentStatus(req.params.id);
  return res.json({ data: payment });
}
