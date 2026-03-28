import { Request, Response } from 'express';
import * as dashboardService from './dashboard.service';

export async function getStatsHandler(req: Request, res: Response) {
  const barberId =
    req.user!.role === 'SUB_ADMIN' ? req.user!.managedBarberId ?? undefined : undefined;
  if (req.user!.role === 'SUB_ADMIN' && !barberId) {
    return res.json({
      data: {
        totalRevenue: 0,
        appointmentsToday: 0,
        totalClients: 0,
        totalBarbers: 0,
        monthlyRevenue: 0,
        weeklyAppointments: 0,
      },
    });
  }

  const stats = await dashboardService.getStats({
    startDate: typeof req.query.startDate === 'string' ? req.query.startDate : undefined,
    endDate: typeof req.query.endDate === 'string' ? req.query.endDate : undefined,
    barberId,
  });
  return res.json({ data: stats });
}
