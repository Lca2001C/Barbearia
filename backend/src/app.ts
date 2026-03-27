import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import { routes } from './routes';
import { errorHandler } from './shared/middlewares/errorHandler';

const app = express();

app.set('trust proxy', 1);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }),
);

const corsOrigins = env.CORS_ORIGIN.split(',')
  .map((o) => o.trim())
  .filter(Boolean);
const wildcardCors = corsOrigins.includes('*');
const allowedOrigins = new Set(corsOrigins.filter((o) => o !== '*'));
const isDev = process.env.NODE_ENV !== 'production';

function isLocalDevOrigin(origin: string) {
  return /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?$/i.test(origin);
}

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (wildcardCors) return callback(null, true);
      if (allowedOrigins.has(origin)) return callback(null, true);
      if (isDev && isLocalDevOrigin(origin)) return callback(null, true);
      callback(null, false);
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

if (env.RATE_LIMIT_MAX > 0) {
  app.use(
    rateLimit({
      windowMs: env.RATE_LIMIT_WINDOW_MS,
      max: env.RATE_LIMIT_MAX,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        error: { message: 'Muitas requisições, tente novamente mais tarde', statusCode: 429 },
      },
    }),
  );
}

app.use('/api', routes);

app.use(errorHandler);

export { app };
