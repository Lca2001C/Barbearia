import { Router } from 'express';
import {
  listBarbersHandler,
  getBarberHandler,
  createBarberHandler,
  updateBarberHandler,
  deleteBarberHandler,
  setWorkingHoursHandler,
  getAvailabilityHandler,
  getBarbersMetricsOverviewHandler,
  getBarberHistoryHandler,
} from './barber.controller';
import { authenticate, authorize, optionalAuthenticate } from '../../shared/middlewares/auth';
import { validate } from '../../shared/middlewares/validate';
import { createBarberSchema, updateBarberSchema, setWorkingHoursSchema } from './barber.schema';

const router = Router();

router.get(
  '/metrics/overview',
  authenticate,
  authorize('ADMIN', 'SUB_ADMIN'),
  getBarbersMetricsOverviewHandler,
);

router.get('/', optionalAuthenticate, listBarbersHandler);
router.get('/:id/availability', optionalAuthenticate, getAvailabilityHandler);
router.get(
  '/:id/history',
  authenticate,
  authorize('ADMIN', 'SUB_ADMIN'),
  getBarberHistoryHandler,
);
router.get('/:id', optionalAuthenticate, getBarberHandler);

router.post('/', authenticate, authorize('ADMIN'), validate(createBarberSchema), createBarberHandler);
router.put('/:id', authenticate, authorize('ADMIN'), validate(updateBarberSchema), updateBarberHandler);
router.delete('/:id', authenticate, authorize('ADMIN'), deleteBarberHandler);
router.put('/:id/working-hours', authenticate, authorize('ADMIN'), validate(setWorkingHoursSchema), setWorkingHoursHandler);

export { router as barberRoutes };
