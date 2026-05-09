import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/authenticate';
import { requireOwnerOrAdmin } from '../middleware/require-owner-or-admin';
import {
  deleteUserCriteriaHandler,
  getUserCriteria,
  getUserCriteriaEntry,
  putUserCriteria,
} from '../controllers/user-criteria.controller';

const router = Router();

const compositeParamsSchema = z.object({
  id_user: z.coerce.number().int().positive(),
  id_criterion: z.coerce.number().int().positive(),
});

const userParamsSchema = z.object({
  id_user: z.coerce.number().int().positive(),
});

const scoreBodySchema = z.object({
  score: z.number().min(0).max(5),
});

// GET /api/user-criteria/:id_user              → propriétaire ou admin
router.get('/:id_user', authenticate, requireOwnerOrAdmin('id_user'), validate(userParamsSchema, 'params'), getUserCriteria);
/**
 * @openapi
 * /user-criteria/{id_user}:
 *   get:
 *     summary: Critères d'un utilisateur (propriétaire ou ADMIN)
 *     tags: [UserCriteria]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id_user, required: true, schema: { type: integer } }
 *     responses:
 *       200:
 *         description: Liste des scores critères de l'utilisateur
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id_criterion: { type: integer }
 *                           score: { type: number }
 *       401: { description: Non authentifié }
 *       403: { description: Accès refusé }
 *       404: { description: Utilisateur introuvable }
 * /user-criteria/{id_user}/{id_criterion}:
 *   get:
 *     summary: Score d'un critère pour un utilisateur
 *     tags: [UserCriteria]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id_user, required: true, schema: { type: integer } }
 *       - { in: path, name: id_criterion, required: true, schema: { type: integer } }
 *     responses:
 *       200:
 *         description: Score trouvé
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ApiSuccess' }
 *       401: { description: Non authentifié }
 *       403: { description: Accès refusé }
 *       404: { description: Entrée introuvable }
 *   put:
 *     summary: Crée ou met à jour un score critère (propriétaire ou ADMIN)
 *     tags: [UserCriteria]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id_user, required: true, schema: { type: integer } }
 *       - { in: path, name: id_criterion, required: true, schema: { type: integer } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [score]
 *             properties:
 *               score: { type: number, minimum: 0, maximum: 5 }
 *     responses:
 *       200:
 *         description: Score mis à jour
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ApiSuccess' }
 *       400: { description: Score hors bornes }
 *       401: { description: Non authentifié }
 *       403: { description: Accès refusé }
 *   delete:
 *     summary: Supprime un score critère (propriétaire ou ADMIN)
 *     tags: [UserCriteria]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id_user, required: true, schema: { type: integer } }
 *       - { in: path, name: id_criterion, required: true, schema: { type: integer } }
 *     responses:
 *       200: { description: Supprimé }
 *       401: { description: Non authentifié }
 *       403: { description: Accès refusé }
 *       404: { description: Entrée introuvable }
 */

// GET /api/user-criteria/:id_user/:id_criterion → propriétaire ou admin
router.get(
  '/:id_user/:id_criterion',
  authenticate,
  requireOwnerOrAdmin('id_user'),
  validate(compositeParamsSchema, 'params'),
  getUserCriteriaEntry,
);

// PUT /api/user-criteria/:id_user/:id_criterion → propriétaire ou admin
router.put(
  '/:id_user/:id_criterion',
  authenticate,
  requireOwnerOrAdmin('id_user'),
  validate(compositeParamsSchema, 'params'),
  validate(scoreBodySchema),
  putUserCriteria,
);

// DELETE /api/user-criteria/:id_user/:id_criterion → propriétaire ou admin
router.delete(
  '/:id_user/:id_criterion',
  authenticate,
  requireOwnerOrAdmin('id_user'),
  validate(compositeParamsSchema, 'params'),
  deleteUserCriteriaHandler,
);

export default router;
