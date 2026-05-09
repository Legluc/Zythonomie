import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { HttpError } from '../lib/http-error';

export interface AuthUser {
  id: number;
  role: Role;
}

// Augmentation des types Express pour req.user
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new HttpError(401, 'UNAUTHORIZED', 'Token d\'authentification requis');
  }

  const token = authHeader.slice(7);
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET is not defined');
  }

  try {
    const payload = jwt.verify(token, secret) as unknown as { sub: number; role: Role };
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw new HttpError(401, 'TOKEN_EXPIRED', 'Token expiré');
    }
    throw new HttpError(401, 'INVALID_TOKEN', 'Token invalide');
  }
}
