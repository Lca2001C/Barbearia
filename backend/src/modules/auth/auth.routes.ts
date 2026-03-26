import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  registerHandler,
  loginHandler,
  refreshHandler,
  forgotPasswordHandler,
  resetPasswordHandler,
  logoutHandler,
} from './auth.controller';
import { validate } from '../../shared/middlewares/validate';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from './auth.schema';
import { env } from '../../config/env';

const router = Router();
const loginRateLimiter = rateLimit({
  windowMs: env.LOGIN_RATE_LIMIT_WINDOW_MS,
  max: env.LOGIN_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      message: 'Muitas tentativas de login. Tente novamente em instantes.',
      statusCode: 429,
    },
  },
});

router.post('/', validate(registerSchema), registerHandler);
router.post('/login', loginRateLimiter, validate(loginSchema), loginHandler);
router.post('/refresh', refreshHandler);
router.post('/logout', logoutHandler);
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPasswordHandler);
router.post('/reset-password', validate(resetPasswordSchema), resetPasswordHandler);

export { router as authRoutes };
