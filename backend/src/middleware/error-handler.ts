import { NextFunction, Request, Response } from 'express';
import { HttpError } from '../lib/http-error';
import { sendError } from '../lib/response';

export function notFoundHandler(_req: Request, res: Response): void {
  sendError(res, 404, {
    code: 'NOT_FOUND',
    message: 'Route introuvable',
  });
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof HttpError) {
    sendError(res, err.statusCode, {
      code: err.code,
      message: err.message,
      details: err.details,
    });
    return;
  }

  if (err instanceof Error) {
    sendError(res, 500, {
      code: 'INTERNAL_ERROR',
      message: err.message,
    });
    return;
  }

  sendError(res, 500, {
    code: 'INTERNAL_ERROR',
    message: 'Une erreur inattendue est survenue',
  });
}
