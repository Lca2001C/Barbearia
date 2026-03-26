import { Request, Response } from 'express';
import * as dashboardService from './dashboard.service';

export async function getStatsHandler(req: Request, res: Response) {
  // #region agent log
  fetch('http://127.0.0.1:7772/ingest/efa8c094-3985-4d28-bcde-0c4cf7f1376c',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'ff99de'},body:JSON.stringify({sessionId:'ff99de',runId:'initial',hypothesisId:'H2',location:'backend/src/modules/dashboard/dashboard.controller.ts:getStatsHandler',message:'Dashboard stats endpoint hit',data:{hasUser:!!req.user,startDate:typeof req.query.startDate==='string',endDate:typeof req.query.endDate==='string'},timestamp:Date.now()})}).catch(()=>{})
  // #endregion
  const stats = await dashboardService.getStats({
    startDate: typeof req.query.startDate === 'string' ? req.query.startDate : undefined,
    endDate: typeof req.query.endDate === 'string' ? req.query.endDate : undefined,
  });
  return res.json({ data: stats });
}
