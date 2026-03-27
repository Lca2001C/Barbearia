import { Request, Response } from 'express';
import { AppError } from '../../shared/errors/AppError';
import * as dashboardService from './dashboard.service';

export async function getStatsHandler(req: Request, res: Response) {
  const barberId =
    req.user!.role === 'SUB_ADMIN' ? req.user!.managedBarberId ?? undefined : undefined;
  if (req.user!.role === 'SUB_ADMIN' && !barberId) {
    throw new AppError('Sub-admin sem barbeiro vinculado', 403);
  }

  const stats = await dashboardService.getStats({
    startDate: typeof req.query.startDate === 'string' ? req.query.startDate : undefined,
    endDate: typeof req.query.endDate === 'string' ? req.query.endDate : undefined,
    barberId,
  });
  return res.json({ data: stats });
}
