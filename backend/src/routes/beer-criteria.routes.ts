import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/authenticate';
import { requireAdmin } from '../middleware/require-admin';
import {
  deleteBeerCriteriaHandler,
  getBeerCriteria,
  getBeerCriteriaEntry,
  putBeerCriteria,
} from '../controllers/beer-criteria.controller';

const router = Router();

const compositeParamsSchema = z.object({
  id_beer: z.coerce.number().int().positive(),
  id_criterion: z.coerce.number().int().positive(),
});

const beerParamsSchema = z.object({
  id_beer: z.coerce.number().int().positive(),
});

const scoreBodySchema = z.object({
  score: z.number().min(0).max(5),
});

// GET /api/beer-criteria/:id_beer              → authentifié
router.get('/:id_beer', authenticate, validate(beerParamsSchema, 'params'), getBeerCriteria);
/**
 * @openapi
 * /beer-criteria/{id_beer}:
 *   get:
 *     summary: Critères d'une bière
 *     tags: [BeerCriteria]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id_beer, required: true, schema: { type: integer } }
 *     responses:
 *       200:
 *         description: Liste des scores critères de la bière
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
 *       404: { description: Bière introuvable }
 * /beer-criteria/{id_beer}/{id_criterion}:
 *   get:
 *     summary: Score d'un critère pour une bière
 *     tags: [BeerCriteria]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id_beer, required: true, schema: { type: integer } }
 *       - { in: path, name: id_criterion, required: true, schema: { type: integer } }
 *     responses:
 *       200:
 *         description: Score trouvé
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ApiSuccess' }
 *       401: { description: Non authentifié }
 *       404: { description: Entrée introuvable }
 *   put:
 *     summary: Crée ou met à jour un score critère pour une bière (ADMIN)
 *     tags: [BeerCriteria]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id_beer, required: true, schema: { type: integer } }
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
 *     summary: Supprime un score critère pour une bière (ADMIN)
 *     tags: [BeerCriteria]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id_beer, required: true, schema: { type: integer } }
 *       - { in: path, name: id_criterion, required: true, schema: { type: integer } }
 *     responses:
 *       200: { description: Supprimé }
 *       401: { description: Non authentifié }
 *       403: { description: Accès refusé }
 *       404: { description: Entrée introuvable }
 */

// GET /api/beer-criteria/:id_beer/:id_criterion → authentifié
router.get(
  '/:id_beer/:id_criterion',
  authenticate,
  validate(compositeParamsSchema, 'params'),
  getBeerCriteriaEntry,
);

// PUT /api/beer-criteria/:id_beer/:id_criterion → ADMIN
router.put(
  '/:id_beer/:id_criterion',
  authenticate,
  requireAdmin,
  validate(compositeParamsSchema, 'params'),
  validate(scoreBodySchema),
  putBeerCriteria,
);

// DELETE /api/beer-criteria/:id_beer/:id_criterion — ADMIN
router.delete(
  '/:id_beer/:id_criterion',
  authenticate,
  requireAdmin,
  validate(compositeParamsSchema, 'params'),
  deleteBeerCriteriaHandler,
);

export default router;
