import { Router } from 'express';
import {
  listByBarberHandler,
  createItemHandler,
  updateItemHandler,
  deleteItemHandler,
} from './stock.controller';
import { authenticate, authorize } from '../../shared/middlewares/auth';
import { validate } from '../../shared/middlewares/validate';
import { createStockItemSchema, updateStockItemSchema } from './stock.schema';

const router = Router();

router.get(
  '/barber/:barberId',
  authenticate,
  authorize('ADMIN'),
  listByBarberHandler,
);

router.post(
  '/barber/:barberId',
  authenticate,
  authorize('ADMIN'),
  validate(createStockItemSchema),
  createItemHandler,
);

router.put(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  validate(updateStockItemSchema),
  updateItemHandler,
);

router.delete('/:id', authenticate, authorize('ADMIN'), deleteItemHandler);

export { router as stockRoutes };
