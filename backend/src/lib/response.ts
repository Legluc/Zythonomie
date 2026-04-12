import { Response } from 'express';
import { ApiErrorBody } from '../types/api';

export function sendSuccess<T>(res: Response, status: number, data: T): void {
  res.status(status).json({
    success: true,
    data,
  });
}

export function sendError(res: Response, status: number, error: ApiErrorBody): void {
  res.status(status).json({
    success: false,
    error,
  });
}
