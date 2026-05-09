import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/authenticate';
import { requireOwnerOrAdmin } from '../middleware/require-owner-or-admin';
import { getRecommendations, postRefreshRecommendations } from '../controllers/recommendation.controller';

const router = Router();

const userIdSchema = z.object({
  userId: z.coerce.number().int().positive(),
});

const recommendationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

router.get(
  '/user/:userId',
  authenticate,
  requireOwnerOrAdmin('userId'),
  validate(userIdSchema, 'params'),
  validate(recommendationQuerySchema, 'query'),
  getRecommendations,
);
/**
 * @openapi
 * /recommendations/user/{userId}:
 *   get:
 *     summary: Recommandations de bières pour un utilisateur (propriétaire ou ADMIN)
 *     tags: [Recommendations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: userId, required: true, schema: { type: integer } }
 *       - { in: query, name: page, schema: { type: integer, default: 1 } }
 *       - { in: query, name: limit, schema: { type: integer, default: 20, maximum: 100 } }
 *     responses:
 *       200:
 *         description: Recommandations paginées triées par score décroissant
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         data:
 *                           type: array
 *                           items: { $ref: '#/components/schemas/Recommendation' }
 *                         meta: { $ref: '#/components/schemas/PaginationMeta' }
 *       401: { description: Non authentifié }
 *       403: { description: Accès refusé }
 *       404: { description: Utilisateur introuvable }
 * /recommendations/refresh/{userId}:
 *   post:
 *     summary: Recalcule les recommandations (produit scalaire) pour un utilisateur
 *     tags: [Recommendations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: userId, required: true, schema: { type: integer } }
 *     responses:
 *       200:
 *         description: Recommandations recalculées et persistées
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items: { $ref: '#/components/schemas/Recommendation' }
 *       401: { description: Non authentifié }
 *       403: { description: Accès refusé }
 *       404: { description: Utilisateur introuvable }
 */
router.post(
  '/refresh/:userId',
  authenticate,
  requireOwnerOrAdmin('userId'),
  validate(userIdSchema, 'params'),
  validate(recommendationQuerySchema, 'query'),
  postRefreshRecommendations,
);

export default router;
