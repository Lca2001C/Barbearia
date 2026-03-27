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

  // #region agent log
  fetch('http://127.0.0.1:7772/ingest/efa8c094-3985-4d28-bcde-0c4cf7f1376c',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'ff99de'},body:JSON.stringify({sessionId:'ff99de',runId:'initial',hypothesisId:'H4',location:'backend/src/shared/middlewares/auth.ts:authenticate:source',message:'Auth token source evaluation',data:{hasBearer:!!bearerToken,hasCookie:!!cookieToken,path:req.path},timestamp:Date.now()})}).catch(()=>{})
  // #endregion

  if (!token) {
    // #region agent log
    fetch('http://127.0.0.1:7772/ingest/efa8c094-3985-4d28-bcde-0c4cf7f1376c',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'ff99de'},body:JSON.stringify({sessionId:'ff99de',runId:'initial',hypothesisId:'H4',location:'backend/src/shared/middlewares/auth.ts:authenticate:no-token',message:'Auth failed due to missing token',data:{path:req.path},timestamp:Date.now()})}).catch(()=>{})
    // #endregion
    throw new AppError('Token não fornecido', 401);
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as TokenPayload;
    req.user = { id: decoded.id, role: decoded.role };
    // #region agent log
    fetch('http://127.0.0.1:7772/ingest/efa8c094-3985-4d28-bcde-0c4cf7f1376c',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'ff99de'},body:JSON.stringify({sessionId:'ff99de',runId:'initial',hypothesisId:'H4',location:'backend/src/shared/middlewares/auth.ts:authenticate:verified',message:'Auth token verified',data:{path:req.path,role:decoded.role},timestamp:Date.now()})}).catch(()=>{})
    // #endregion
    next();
  } catch {
    // #region agent log
    fetch('http://127.0.0.1:7772/ingest/efa8c094-3985-4d28-bcde-0c4cf7f1376c',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'ff99de'},body:JSON.stringify({sessionId:'ff99de',runId:'initial',hypothesisId:'H4',location:'backend/src/shared/middlewares/auth.ts:authenticate:invalid',message:'Auth failed due to invalid/expired token',data:{path:req.path},timestamp:Date.now()})}).catch(()=>{})
    // #endregion
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
