import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { env } from '../../config/env';
import { AppError } from '../errors/AppError';

interface TokenPayload {
  id: string;
  role: Role;
}

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const cookieToken = req.cookies?.[env.JWT_ACCESS_COOKIE_NAME];
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
  const token = bearerToken ?? cookieToken;

  if (!token) {
    throw new AppError('Token não fornecido', 401);
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as TokenPayload;
    req.user = { id: decoded.id, role: decoded.role };
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
