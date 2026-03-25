import { Request, Response } from 'express';
import * as dashboardService from './dashboard.service';

export async function getStatsHandler(_req: Request, res: Response) {
  const stats = await dashboardService.getStats();
  return res.json({ data: stats });
}
