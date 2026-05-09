import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/authenticate';
import { requireAdmin } from '../middleware/require-admin';
import {
  deleteCriterionHandler,
  getCriteria,
  getCriterionById,
  patchCriterion,
  postCriterion,
} from '../controllers/criterion.controller';

const router = Router();

const idParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

const criterionCreateSchema = z.object({
  name: z.string().trim().min(1).max(50),
  description: z.string().trim().min(1),
});

const criterionUpdateSchema = z
  .object({
    name: z.string().trim().min(1).max(50).optional(),
    description: z.string().trim().min(1).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Au moins un champ est requis pour la mise à jour',
  });

// Lecture : utilisateur authentifié
router.get('/', authenticate, getCriteria);
/**
 * @openapi
 * /criteria:
 *   get:
 *     summary: Liste tous les critères
 *     tags: [Criteria]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des critères
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items: { $ref: '#/components/schemas/Criterion' }
 *       401: { description: Non authentifié }
 *   post:
 *     summary: Crée un critère (ADMIN)
 *     tags: [Criteria]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, description]
 *             properties:
 *               name: { type: string, maxLength: 50 }
 *               description: { type: string }
 *     responses:
 *       201:
 *         description: Critère créé
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/Criterion' }
 *       400: { description: Données invalides }
 *       401: { description: Non authentifié }
 *       403: { description: Accès refusé }
 */
router.get('/:id', authenticate, validate(idParamsSchema, 'params'), getCriterionById);
/**
 * @openapi
 * /criteria/{id}:
 *   get:
 *     summary: Détail d'un critère
 *     tags: [Criteria]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     responses:
 *       200:
 *         description: Critère trouvé
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/Criterion' }
 *       401: { description: Non authentifié }
 *       404: { description: Critère introuvable }
 *   patch:
 *     summary: Met à jour un critère (ADMIN)
 *     tags: [Criteria]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *     responses:
 *       200:
 *         description: Critère mis à jour
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/Criterion' }
 *       400: { description: Données invalides }
 *       401: { description: Non authentifié }
 *       403: { description: Accès refusé }
 *       404: { description: Critère introuvable }
 *   delete:
 *     summary: Supprime un critère (ADMIN) — bloqué si en usage
 *     tags: [Criteria]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     responses:
 *       200: { description: Supprimé }
 *       401: { description: Non authentifié }
 *       403: { description: Accès refusé }
 *       404: { description: Critère introuvable }
 *       409: { description: Critère utilisé dans des sessions ou user-criteria }
 */

// Mutations réservées aux admins
router.post('/', authenticate, requireAdmin, validate(criterionCreateSchema), postCriterion);
router.patch('/:id', authenticate, requireAdmin, validate(idParamsSchema, 'params'), validate(criterionUpdateSchema), patchCriterion);
router.delete('/:id', authenticate, requireAdmin, validate(idParamsSchema, 'params'), deleteCriterionHandler);

export default router;
