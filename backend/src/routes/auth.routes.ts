import { Router } from 'express';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/authenticate';
import {
  registerHandler,
  loginHandler,
  refreshHandler,
  getMeHandler,
  logoutHandler,
} from '../controllers/auth.controller';

const router = Router();

const registerSchema = z.object({
  name: z.string().min(1).max(50),
  firstname: z.string().min(1).max(50),
  mail: z.string().email(),
  password: z.string().min(8),
  birthday: z.string().date(),
  adress: z.string().min(1).max(255),
  icon: z.string().max(255).optional(),
});

const loginSchema = z.object({
  mail: z.string().email(),
  password: z.string().min(1),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: 'TOO_MANY_REQUESTS', message: 'Trop de tentatives de connexion. Réessayez dans 1 minute.' },
  },
  skip: () => process.env.NODE_ENV === 'test',
});

router.post('/register', validate(registerSchema, 'body'), registerHandler);
/**
 * @openapi
 * /auth/register:
 *   post:
 *     summary: Inscription d'un nouvel utilisateur
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, firstname, mail, password, birthday, adress]
 *             properties:
 *               name: { type: string, maxLength: 50 }
 *               firstname: { type: string, maxLength: 50 }
 *               mail: { type: string, format: email }
 *               password: { type: string, minLength: 8 }
 *               birthday: { type: string, format: date }
 *               adress: { type: string, maxLength: 255 }
 *               icon: { type: string, maxLength: 255 }
 *     responses:
 *       201:
 *         description: Utilisateur créé — retourne les tokens
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/Tokens' }
 *       400:
 *         description: Données invalides
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ApiError' }
 *       409:
 *         description: Email déjà utilisé
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ApiError' }
 */
router.post('/login', loginLimiter, validate(loginSchema, 'body'), loginHandler);
/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Connexion (retourne access + refresh token)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [mail, password]
 *             properties:
 *               mail: { type: string, format: email }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Connexion réussie
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/Tokens' }
 *       401:
 *         description: Identifiants invalides
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ApiError' }
 *       429:
 *         description: Trop de tentatives (rate limit)
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ApiError' }
 */
router.post('/refresh', validate(refreshSchema, 'body'), refreshHandler);
/**
 * @openapi
 * /auth/refresh:
 *   post:
 *     summary: Renouvelle l'access token via le refresh token (rotation)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken: { type: string }
 *     responses:
 *       200:
 *         description: Nouveaux tokens émis
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/Tokens' }
 *       401:
 *         description: Refresh token invalide ou révoqué
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ApiError' }
 */
router.get('/me', authenticate, getMeHandler);
/**
 * @openapi
 * /auth/me:
 *   get:
 *     summary: Profil de l'utilisateur connecté
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profil utilisateur
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/User' }
 *       401:
 *         description: Non authentifié
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ApiError' }
 */
router.post('/logout', authenticate, validate(refreshSchema, 'body'), logoutHandler);
/**
 * @openapi
 * /auth/logout:
 *   post:
 *     summary: Révoque le refresh token (déconnexion)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken: { type: string }
 *     responses:
 *       200:
 *         description: Déconnexion réussie
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ApiSuccess' }
 *       401:
 *         description: Non authentifié
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ApiError' }
 */

export default router;
