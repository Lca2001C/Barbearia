import { Request, Response } from 'express';
import * as authService from './auth.service';
import { env } from '../../config/env';

/** SameSite=None exige atributo Secure=true (RFC). Navegadores só enviam cookies em HTTPS; com certificado não confiável (ex.: Caddy tls internal), aceite o certificado ou o cookie não será enviado. */
function cookieSecureFlag(): boolean {
  return env.COOKIE_SECURE || env.COOKIE_SAMESITE === 'none';
}

function buildCookieOptions(maxAgeMs: number) {
  return {
    httpOnly: true,
    sameSite: env.COOKIE_SAMESITE,
    secure: cookieSecureFlag(),
    path: '/',
    maxAge: maxAgeMs,
  };
}

function setAuthCookies(
  res: Response,
  tokens: {
    accessToken: string;
    refreshToken: string;
  },
) {
  res.cookie(
    env.JWT_ACCESS_COOKIE_NAME,
    tokens.accessToken,
    buildCookieOptions(15 * 60 * 1000),
  );
  res.cookie(
    env.JWT_REFRESH_COOKIE_NAME,
    tokens.refreshToken,
    buildCookieOptions(7 * 24 * 60 * 60 * 1000),
  );
}

function clearAuthCookies(res: Response) {
  const options = {
    httpOnly: true,
    sameSite: env.COOKIE_SAMESITE,
    secure: cookieSecureFlag(),
    path: '/',
  };
  res.clearCookie(env.JWT_ACCESS_COOKIE_NAME, options);
  res.clearCookie(env.JWT_REFRESH_COOKIE_NAME, options);
}

export async function registerHandler(req: Request, res: Response) {
  const result = await authService.register(req.body);
  setAuthCookies(res, result);
  return res.status(201).json({ data: { user: result.user } });
}

export async function loginHandler(req: Request, res: Response) {
  const result = await authService.login(req.body);
  setAuthCookies(res, result);
  return res.json({ data: { user: result.user } });
}

export async function refreshHandler(req: Request, res: Response) {
  const refreshToken =
    req.cookies?.[env.JWT_REFRESH_COOKIE_NAME] ??
    (req.body && typeof req.body.refreshToken === 'string' ? req.body.refreshToken : undefined);

  if (!refreshToken) {
    clearAuthCookies(res);
    return res.status(401).json({
      error: { message: 'Refresh token não fornecido', statusCode: 401 },
    });
  }

  const result = await authService.refreshToken(refreshToken);
  setAuthCookies(res, result);
  return res.json({ data: { user: result.user } });
}

export async function forgotPasswordHandler(req: Request, res: Response) {
  await authService.forgotPassword(req.body);
  return res.json({
    data: { success: true, message: 'Se o e-mail existir, você receberá as instruções de recuperação.' },
  });
}

export async function resetPasswordHandler(req: Request, res: Response) {
  await authService.resetPassword(req.body);
  clearAuthCookies(res);
  return res.json({ data: { success: true, message: 'Senha redefinida com sucesso.' } });
}

export async function logoutHandler(_req: Request, res: Response) {
  clearAuthCookies(res);
  return res.json({ data: { success: true } });
}
