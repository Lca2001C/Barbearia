import { Request, Response } from 'express';
import * as dashboardService from './dashboard.service';

export async function getStatsHandler(req: Request, res: Response) {
  const stats = await dashboardService.getStats({
    startDate: typeof req.query.startDate === 'string' ? req.query.startDate : undefined,
    endDate: typeof req.query.endDate === 'string' ? req.query.endDate : undefined,
  });
  return res.json({ data: stats });
}
