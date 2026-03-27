import { Router } from 'express';
import { getStatsHandler } from './dashboard.controller';
import { authenticate, authorize } from '../../shared/middlewares/auth';

const router = Router();

router.get('/stats', authenticate, authorize('ADMIN', 'SUB_ADMIN'), getStatsHandler);

export { router as dashboardRoutes };
