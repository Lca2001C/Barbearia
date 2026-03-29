import { describe, it, expect } from 'vitest';

/** Espelha a lógica de rotas públicas do axios (smoke test de contrato). */
function isPublicAuthPath(url: string | undefined): boolean {
  if (!url) return false;
  return (
    url === '/auth' ||
    url.startsWith('/auth/login') ||
    url.startsWith('/auth/forgot-password') ||
    url.startsWith('/auth/reset-password') ||
    url.startsWith('/auth/refresh')
  );
}

describe('rotas públicas de auth (contrato)', () => {
  it('login e refresh são públicos', () => {
    expect(isPublicAuthPath('/auth/login')).toBe(true);
    expect(isPublicAuthPath('/auth/refresh')).toBe(true);
  });

  it('/users/me não é público', () => {
    expect(isPublicAuthPath('/users/me')).toBe(false);
  });
});
