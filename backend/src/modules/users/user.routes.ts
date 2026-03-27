import { Router } from 'express';
import { getProfileHandler, updateProfileHandler, listUsersHandler } from './user.controller';
import { authenticate, authorize } from '../../shared/middlewares/auth';
import { validate } from '../../shared/middlewares/validate';
import { updateProfileSchema } from './user.schema';

const router = Router();

router.get('/me', authenticate, getProfileHandler);
router.put('/me', authenticate, validate(updateProfileSchema), updateProfileHandler);
router.get('/', authenticate, authorize('ADMIN'), listUsersHandler);

export { router as userRoutes };
