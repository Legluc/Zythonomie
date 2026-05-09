import { Request, Response, NextFunction } from 'express';
import { HttpError } from '../lib/http-error';

/**
 * Middleware : autorise si l'utilisateur est ADMIN, ou si le param URL
 * `paramName` correspond à l'id de l'utilisateur authentifié.
 *
 * Doit être précédé du middleware `authenticate`.
 *
 * Usage : requireOwnerOrAdmin('userId')  →  vérifie req.params.userId === req.user.id
 */
export function requireOwnerOrAdmin(paramName: string) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const user = req.user!;

    if (user.role === 'ADMIN') {
      return next();
    }

    const paramValue = Number(req.params[paramName]);
    if (paramValue === user.id) {
      return next();
    }

    throw new HttpError(403, 'FORBIDDEN', 'Accès non autorisé');
  };
}
