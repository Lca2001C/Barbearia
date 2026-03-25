import { Router } from 'express';
import {
  listServicesHandler,
  getServiceHandler,
  createServiceHandler,
  updateServiceHandler,
  deleteServiceHandler,
} from './service.controller';
import { authenticate, authorize } from '../../shared/middlewares/auth';
import { validate } from '../../shared/middlewares/validate';
import { createServiceSchema, updateServiceSchema } from './service.schema';

const router = Router();

router.get('/', listServicesHandler);
router.get('/:id', getServiceHandler);

router.post('/', authenticate, authorize('ADMIN'), validate(createServiceSchema), createServiceHandler);
router.put('/:id', authenticate, authorize('ADMIN'), validate(updateServiceSchema), updateServiceHandler);
router.delete('/:id', authenticate, authorize('ADMIN'), deleteServiceHandler);

export { router as serviceRoutes };
