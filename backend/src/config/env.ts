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
  PORT: z.coerce.number().default(3333),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  MERCADOPAGO_ACCESS_TOKEN: z.preprocess(emptyToUndefined, z.string().optional()),
  VAPID_PUBLIC_KEY: z.preprocess(emptyToUndefined, z.string().optional()),
  VAPID_PRIVATE_KEY: z.preprocess(emptyToUndefined, z.string().optional()),
  VAPID_EMAIL: z.preprocess(emptyToUndefined, z.string().email().optional()),
  /** 0 = desliga o rate limit (útil só em dev local). Padrão: 2000 req / janela. */
  RATE_LIMIT_MAX: z.coerce.number().default(2000),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(15 * 60 * 1000),
});

export const env = envSchema.parse(process.env);
