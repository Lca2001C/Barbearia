import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { env } from '../../config/env';
import { AppError } from '../errors/AppError';

export interface TokenPayload {
  id: string;
  role: Role;
  managedBarberId?: string | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

function readToken(req: Request): string | undefined {
  const authHeader = req.headers.authorization;
  const cookieToken = req.cookies?.[env.JWT_ACCESS_COOKIE_NAME];
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
  return bearerToken ?? cookieToken;
}

export function optionalAuthenticate(req: Request, _res: Response, next: NextFunction) {
  const token = readToken(req);
  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as TokenPayload;
    req.user = {
      id: decoded.id,
      role: decoded.role,
      managedBarberId: decoded.managedBarberId ?? null,
    };
    next();
  } catch {
    next();
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const token = readToken(req);

  if (!token) {
    throw new AppError('Token não fornecido', 401);
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as TokenPayload;
    req.user = {
      id: decoded.id,
      role: decoded.role,
      managedBarberId: decoded.managedBarberId ?? null,
    };
    next();
  } catch {
    throw new AppError('Token inválido ou expirado', 401);
  }
}

export function authorize(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError('Não autenticado', 401);
    }

    if (!roles.includes(req.user.role)) {
      throw new AppError('Acesso não autorizado', 403);
    }

    next();
  };
}
