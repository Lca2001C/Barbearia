import 'dotenv/config';
import { z } from 'zod';

function emptyToUndefined(value: unknown) {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'string' && value.trim() === '') return undefined;
  return value;
}

const envSchema = z.object({
  DATABASE_URL: z
    .string()
    .min(1, 'DATABASE_URL é obrigatória')
    .refine(
      (s) => s.startsWith('postgresql://') || s.startsWith('postgres://'),
      'DATABASE_URL deve ser uma URL PostgreSQL',
    ),
  JWT_SECRET: z.string().min(1),
  JWT_REFRESH_SECRET: z.string().min(1),
  JWT_ACCESS_COOKIE_NAME: z.string().default('barbearia_access_token'),
  JWT_REFRESH_COOKIE_NAME: z.string().default('barbearia_refresh_token'),
  ACCESS_TOKEN_TTL: z.string().default('15m'),
  REFRESH_TOKEN_TTL: z.string().default('7d'),
  COOKIE_SECURE: z
    .string()
    .optional()
    .transform((value) => value === 'true'),
  COOKIE_SAMESITE: z.enum(['lax', 'strict', 'none']).default('lax'),
  PORT: z.coerce.number().default(3335),
  CORS_ORIGIN: z.string().default('https://localhost:8443'),
  FRONTEND_URL: z.string().default('https://localhost:8443'),
  PASSWORD_RESET_TOKEN_TTL_MINUTES: z.coerce.number().default(15),
  SMTP_HOST: z.preprocess(emptyToUndefined, z.string().optional()),
  SMTP_PORT: z.preprocess(emptyToUndefined, z.coerce.number().optional()),
  SMTP_USER: z.preprocess(emptyToUndefined, z.string().optional()),
  SMTP_PASS: z.preprocess(emptyToUndefined, z.string().optional()),
  SMTP_FROM: z.preprocess(emptyToUndefined, z.string().email().optional()),
  LOGIN_RATE_LIMIT_MAX: z.coerce.number().default(5),
  LOGIN_RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60 * 1000),
  MERCADOPAGO_ACCESS_TOKEN: z.preprocess(emptyToUndefined, z.string().optional()),
  VAPID_PUBLIC_KEY: z.preprocess(emptyToUndefined, z.string().optional()),
  VAPID_PRIVATE_KEY: z.preprocess(emptyToUndefined, z.string().optional()),
  VAPID_EMAIL: z.preprocess(emptyToUndefined, z.string().email().optional()),
  /** 0 = desliga o rate limit (útil só em dev local). Padrão: 2000 req / janela. */
  RATE_LIMIT_MAX: z.coerce.number().default(2000),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(15 * 60 * 1000),
});

export const env = envSchema.parse(process.env);
