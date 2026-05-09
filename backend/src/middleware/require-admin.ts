import { Request, Response, NextFunction } from 'express';
import { HttpError } from '../lib/http-error';

/**
 * Middleware de vérification du rôle ADMIN.
 * Doit être précédé du middleware `authenticate` qui pose `req.user`.
 */
export function requireAdmin(req: Request, _res: Response, next: NextFunction): void {
  const role = req.user?.role;

  if (role !== 'ADMIN') {
    throw new HttpError(403, 'FORBIDDEN', 'Accès réservé aux administrateurs');
  }

  next();
}
