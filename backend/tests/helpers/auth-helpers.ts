/**
 * Utilitaires d'authentification pour les tests d'intégration.
 * Génère des tokens JWT de test sans passer par bcrypt.
 */

import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET ?? 'test-jwt-secret';
const JWT_ACCESS_EXPIRY = process.env.JWT_ACCESS_EXPIRY ?? '1h';

/**
 * Génère un access token JWT signé pour un utilisateur de test.
 * Permet d'authentifier des requêtes HTTP sans inscription préalable.
 */
export function signTestToken(userId: number, role: 'USER' | 'ADMIN' = 'USER'): string {
  return jwt.sign({ sub: userId, role }, JWT_SECRET, {
    expiresIn: JWT_ACCESS_EXPIRY as any,
    jwtid: `test-${userId}-${Date.now()}`,
  });
}

/** Token ADMIN générique pour les opérations de test (userId = 0, ne correspond à aucun user réel) */
export function adminToken(): string {
  return signTestToken(0, 'ADMIN');
}

/** Token USER pour un utilisateur de test */
export function userToken(userId: number): string {
  return signTestToken(userId, 'USER');
}
