import { Request, Response, NextFunction } from 'express';
import { HttpError } from '../lib/http-error';

/**
 * Middleware de vérification du rôle ADMIN.
 *
 * TODO: Remplacer par une vérification JWT réelle une fois le module
 * d'authentification implémenté. Le token décodé devra être attaché
 * à `req.user` par un middleware `authenticate` en amont.
 *
 * En attendant, lit l'en-tête `X-User-Role` pour les tests manuels.
 * NE PAS utiliser en production sans authentification JWT.
 */
export function requireAdmin(req: Request, _res: Response, next: NextFunction): void {
  // À remplacer par : const role = (req as any).user?.role;
  const role = req.headers['x-user-role'];

  if (role !== 'ADMIN') {
    throw new HttpError(403, 'FORBIDDEN', 'Accès réservé aux administrateurs');
  }

  next();
}
