import { Router } from 'express';
import {
  createAppointmentHandler,
  createAppointmentByAdminHandler,
  listAppointmentsHandler,
  getAppointmentHandler,
  cancelAppointmentHandler,
  completeAppointmentHandler,
  updateAppointmentByAdminHandler,
  deleteAppointmentByAdminHandler,
  getUpcomingHandler,
  getTodayAppointmentsHandler,
  getWeekAppointmentsHandler,
} from './appointment.controller';
import { authenticate, authorize } from '../../shared/middlewares/auth';
import { validate } from '../../shared/middlewares/validate';
import {
  createAppointmentByAdminSchema,
  createAppointmentSchema,
  updateAppointmentByAdminSchema,
} from './appointment.schema';

const router = Router();

router.post('/', authenticate, validate(createAppointmentSchema), createAppointmentHandler);
router.post(
  '/admin',
  authenticate,
  authorize('ADMIN', 'SUB_ADMIN'),
  validate(createAppointmentByAdminSchema),
  createAppointmentByAdminHandler,
);
router.get('/', authenticate, listAppointmentsHandler);
router.get('/upcoming', authenticate, authorize('ADMIN', 'SUB_ADMIN'), getUpcomingHandler);
router.get('/today', authenticate, authorize('ADMIN', 'SUB_ADMIN'), getTodayAppointmentsHandler);
router.get('/week', authenticate, authorize('ADMIN', 'SUB_ADMIN'), getWeekAppointmentsHandler);
router.get('/:id', authenticate, getAppointmentHandler);
router.patch('/:id/cancel', authenticate, cancelAppointmentHandler);
router.patch(
  '/:id/complete',
  authenticate,
  authorize('ADMIN', 'SUB_ADMIN'),
  completeAppointmentHandler,
);
router.patch(
  '/:id',
  authenticate,
  authorize('ADMIN', 'SUB_ADMIN'),
  validate(updateAppointmentByAdminSchema),
  updateAppointmentByAdminHandler,
);
router.delete(
  '/:id',
  authenticate,
  authorize('ADMIN', 'SUB_ADMIN'),
  deleteAppointmentByAdminHandler,
);

export { router as appointmentRoutes };
