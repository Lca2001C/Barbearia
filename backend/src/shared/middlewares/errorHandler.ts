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
        issues: err.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      },
    });
  }

  console.error('Unhandled error:', err);

  return res.status(500).json({
    error: { message: 'Erro interno do servidor', statusCode: 500 },
  });
}
