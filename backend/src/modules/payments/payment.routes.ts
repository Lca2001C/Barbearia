import { Router } from 'express';
import { generatePixHandler, webhookHandler, getPaymentStatusHandler } from './payment.controller';
import { authenticate } from '../../shared/middlewares/auth';
import { validate } from '../../shared/middlewares/validate';
import { generatePixSchema } from './payment.schema';

const router = Router();

router.post('/pix', authenticate, validate(generatePixSchema), generatePixHandler);
router.post('/webhook', webhookHandler);
router.get('/:id/status', authenticate, getPaymentStatusHandler);

export { router as paymentRoutes };
