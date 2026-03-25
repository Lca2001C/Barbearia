import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import { routes } from './routes';
import { errorHandler } from './shared/middlewares/errorHandler';

const app = express();

app.set('trust proxy', 1);

app.use(helmet());

const corsOrigins = env.CORS_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean);
const allowedOrigins = new Set([
  ...corsOrigins.filter((o) => o !== '*'),
  'http://localhost:3000',
  'http://127.0.0.1:3000',
]);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.has(origin)) return callback(null, true);
      callback(null, false);
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: '10mb' }));

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: { message: 'Muitas requisições, tente novamente mais tarde', statusCode: 429 } },
  }),
);

app.use('/api', routes);

app.use(errorHandler);

export { app };
