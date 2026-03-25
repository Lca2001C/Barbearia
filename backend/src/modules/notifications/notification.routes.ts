import { Router, Request, Response } from 'express';
import { authenticate } from '../../shared/middlewares/auth';
import * as notificationService from './notification.service';

const router = Router();

router.post('/subscribe', authenticate, async (req: Request, res: Response) => {
  const subscription = await notificationService.subscribe(req.user!.id, req.body);
  return res.status(201).json({ data: subscription });
});

router.delete('/unsubscribe', authenticate, async (req: Request, res: Response) => {
  await notificationService.unsubscribe(req.user!.id, req.body.endpoint);
  return res.status(204).send();
});

export { router as notificationRoutes };
