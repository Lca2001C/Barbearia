/**
 * Variáveis mínimas antes de importar `app` / `env`.
 * Rate limit global desligado nos testes (RATE_LIMIT_MAX=0).
 */
process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.DATABASE_URL =
  process.env.DATABASE_URL || 'postgresql://test:test@127.0.0.1:5432/barbearia_test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-minimum-32-chars!!';
process.env.JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || 'test-refresh-secret-min-32-chars-x';
process.env.RATE_LIMIT_MAX = '0';
process.env.CORS_ORIGIN = '*';
