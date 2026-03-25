import { Router } from 'express';
import {
  listBarbersHandler,
  getBarberHandler,
  createBarberHandler,
  updateBarberHandler,
  deleteBarberHandler,
  setWorkingHoursHandler,
  getAvailabilityHandler,
} from './barber.controller';
import { authenticate, authorize } from '../../shared/middlewares/auth';
import { validate } from '../../shared/middlewares/validate';
import { createBarberSchema, updateBarberSchema, setWorkingHoursSchema } from './barber.schema';

const router = Router();

router.get('/', listBarbersHandler);
router.get('/:id', getBarberHandler);
router.get('/:id/availability', getAvailabilityHandler);

router.post('/', authenticate, authorize('ADMIN'), validate(createBarberSchema), createBarberHandler);
router.put('/:id', authenticate, authorize('ADMIN'), validate(updateBarberSchema), updateBarberHandler);
router.delete('/:id', authenticate, authorize('ADMIN'), deleteBarberHandler);
router.put('/:id/working-hours', authenticate, authorize('ADMIN'), validate(setWorkingHoursSchema), setWorkingHoursHandler);

export { router as barberRoutes };
