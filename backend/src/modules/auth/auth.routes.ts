import { Router } from 'express';
import { registerHandler, loginHandler, refreshHandler } from './auth.controller';
import { validate } from '../../shared/middlewares/validate';
import { registerSchema, loginSchema } from './auth.schema';

const router = Router();

router.post('/', validate(registerSchema), registerHandler);
router.post('/login', validate(loginSchema), loginHandler);
router.post('/refresh', refreshHandler);

export { router as authRoutes };
