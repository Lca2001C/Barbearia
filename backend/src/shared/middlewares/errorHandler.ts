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
    // #region agent log
    fetch('http://127.0.0.1:7772/ingest/efa8c094-3985-4d28-bcde-0c4cf7f1376c',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'ff99de'},body:JSON.stringify({sessionId:'ff99de',runId:'initial',hypothesisId:'H5',location:'backend/src/shared/middlewares/errorHandler.ts:app-error',message:'Handled AppError response',data:{statusCode:err.statusCode,message:err.message},timestamp:Date.now()})}).catch(()=>{})
    // #endregion
    return res.status(err.statusCode).json({
      error: { message: err.message, statusCode: err.statusCode },
    });
  }

  if (err instanceof ZodError) {
    // #region agent log
    fetch('http://127.0.0.1:7772/ingest/efa8c094-3985-4d28-bcde-0c4cf7f1376c',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'ff99de'},body:JSON.stringify({sessionId:'ff99de',runId:'initial',hypothesisId:'H5',location:'backend/src/shared/middlewares/errorHandler.ts:zod-error',message:'Handled ZodError response',data:{issuesCount:err.issues.length},timestamp:Date.now()})}).catch(()=>{})
    // #endregion
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
  // #region agent log
  fetch('http://127.0.0.1:7772/ingest/efa8c094-3985-4d28-bcde-0c4cf7f1376c',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'ff99de'},body:JSON.stringify({sessionId:'ff99de',runId:'initial',hypothesisId:'H5',location:'backend/src/shared/middlewares/errorHandler.ts:unhandled',message:'Unhandled server error response',data:{name:err.name},timestamp:Date.now()})}).catch(()=>{})
  // #endregion

  return res.status(500).json({
    error: { message: 'Erro interno do servidor', statusCode: 500 },
  });
}
