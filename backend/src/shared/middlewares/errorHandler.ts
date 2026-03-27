import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../errors/AppError';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: { message: err.message, statusCode: err.statusCode },
    });
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      error: {
        message: 'Dados inválidos',
        statusCode: 400,
        issues: err.issues.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      },
    });
  }

  const anyErr = err as unknown as Record<string, unknown>;
  if (anyErr.type === 'entity.parse.failed' && typeof anyErr.statusCode === 'number') {
    return res.status(anyErr.statusCode as number).json({
      error: { message: 'JSON inválido no corpo da requisição', statusCode: anyErr.statusCode },
    });
  }

  console.error('Unhandled error:', err);

  return res.status(500).json({
    error: { message: 'Erro interno do servidor', statusCode: 500 },
  });
}
