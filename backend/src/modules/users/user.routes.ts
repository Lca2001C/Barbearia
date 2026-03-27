import { Router } from 'express';
import {
  changePasswordHandler,
  deleteUserHandler,
  getUserDetailsHandler,
  getProfileHandler,
  updateProfileHandler,
  listUsersHandler,
  listClientsForStaffHandler,
  updateUserRoleHandler,
} from './user.controller';
import { authenticate, authorize } from '../../shared/middlewares/auth';
import { validate } from '../../shared/middlewares/validate';
import {
  changePasswordSchema,
  updateProfileSchema,
  updateUserRoleAdminSchema,
} from './user.schema';

const router = Router();

router.get('/me', authenticate, getProfileHandler);
router.put('/me', authenticate, validate(updateProfileSchema), updateProfileHandler);
router.post('/me/change-password', authenticate, validate(changePasswordSchema), changePasswordHandler);
router.get(
  '/clients',
  authenticate,
  authorize('ADMIN', 'SUB_ADMIN'),
  listClientsForStaffHandler,
);
router.patch(
  '/:id/role',
  authenticate,
  authorize('ADMIN'),
  validate(updateUserRoleAdminSchema),
  updateUserRoleHandler,
);
router.get('/', authenticate, authorize('ADMIN'), listUsersHandler);
router.get('/:id', authenticate, authorize('ADMIN'), getUserDetailsHandler);
router.delete('/:id', authenticate, authorize('ADMIN'), deleteUserHandler);

export { router as userRoutes };
