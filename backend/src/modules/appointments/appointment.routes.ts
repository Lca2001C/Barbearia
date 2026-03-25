import { Router } from 'express';
import {
  createAppointmentHandler,
  listAppointmentsHandler,
  getAppointmentHandler,
  cancelAppointmentHandler,
  completeAppointmentHandler,
  getUpcomingHandler,
} from './appointment.controller';
import { authenticate, authorize } from '../../shared/middlewares/auth';
import { validate } from '../../shared/middlewares/validate';
import { createAppointmentSchema } from './appointment.schema';

const router = Router();

router.post('/', authenticate, validate(createAppointmentSchema), createAppointmentHandler);
router.get('/', authenticate, listAppointmentsHandler);
router.get('/upcoming', authenticate, authorize('ADMIN'), getUpcomingHandler);
router.get('/:id', authenticate, getAppointmentHandler);
router.patch('/:id/cancel', authenticate, cancelAppointmentHandler);
router.patch('/:id/complete', authenticate, authorize('ADMIN'), completeAppointmentHandler);

export { router as appointmentRoutes };
