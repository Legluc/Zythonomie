import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/authenticate';
import { requireAdmin } from '../middleware/require-admin';
import {
  deletePairingHandler,
  getPairingById,
  getPairings,
  postPairing,
  putPairing,
  postPairingCategory,
  deletePairingCategory,
} from '../controllers/pairing.controller';

const router = Router();

const idParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const pairingCreateSchema = z.object({
  name: z.string().trim().min(1).max(50),
  description: z.string().trim().min(1),
  category_ids: z.array(z.number().int().positive()).optional(),
});

const pairingUpdateSchema = z
  .object({
    name: z.string().trim().min(1).max(50).optional(),
    description: z.string().trim().min(1).optional(),
    category_ids: z.array(z.number().int().positive()).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Au moins un champ est requis pour la mise a jour',
  });

router.get('/', authenticate, validate(paginationSchema, 'query'), getPairings);
/**
 * @openapi
 * /pairings:
 *   get:
 *     summary: Liste paginée des accords mets-bières
 *     tags: [Pairings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: query, name: page, schema: { type: integer, default: 1 } }
 *       - { in: query, name: limit, schema: { type: integer, default: 20, maximum: 100 } }
 *     responses:
 *       200:
 *         description: Liste paginée
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
 *                           items: { $ref: '#/components/schemas/Pairing' }
 *                         meta: { $ref: '#/components/schemas/PaginationMeta' }
 *       401: { description: Non authentifié }
 *   post:
 *     summary: Crée un accord mets-bières (ADMIN)
 *     tags: [Pairings]
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
 *               category_ids: { type: array, items: { type: integer } }
 *     responses:
 *       201:
 *         description: Accord créé
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/Pairing' }
 *       400: { description: Données invalides }
 *       401: { description: Non authentifié }
 *       403: { description: Accès refusé }
 */
router.get('/:id', authenticate, validate(idParamsSchema, 'params'), getPairingById);
/**
 * @openapi
 * /pairings/{id}:
 *   get:
 *     summary: Détail d'un accord
 *     tags: [Pairings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     responses:
 *       200:
 *         description: Accord trouvé
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/Pairing' }
 *       401: { description: Non authentifié }
 *       404: { description: Accord introuvable }
 *   put:
 *     summary: Met à jour un accord (ADMIN)
 *     tags: [Pairings]
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
 *               category_ids: { type: array, items: { type: integer } }
 *     responses:
 *       200:
 *         description: Accord mis à jour
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/Pairing' }
 *       400: { description: Données invalides }
 *       401: { description: Non authentifié }
 *       403: { description: Accès refusé }
 *       404: { description: Accord introuvable }
 *   delete:
 *     summary: Supprime un accord (ADMIN)
 *     tags: [Pairings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     responses:
 *       200: { description: Supprimé }
 *       401: { description: Non authentifié }
 *       403: { description: Accès refusé }
 *       404: { description: Accord introuvable }
 */
router.post('/', authenticate, requireAdmin, validate(pairingCreateSchema), postPairing);
router.put('/:id', authenticate, requireAdmin, validate(idParamsSchema, 'params'), validate(pairingUpdateSchema), putPairing);
router.delete('/:id', authenticate, requireAdmin, validate(idParamsSchema, 'params'), deletePairingHandler);

// ─── Liaisons atomiques ───────────────────────────────────────────────────────

const categoryLinkSchema = z.object({ id_category: z.number().int().positive() });
const categoryParamSchema = z.object({
  id: z.coerce.number().int().positive(),
  id_category: z.coerce.number().int().positive(),
});

router.post('/:id/categories', authenticate, requireAdmin, validate(idParamsSchema, 'params'), validate(categoryLinkSchema), postPairingCategory);
/**
 * @openapi
 * /pairings/{id}/categories:
 *   post:
 *     summary: Associe une catégorie à un accord (ADMIN)
 *     tags: [Pairings]
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
 *             required: [id_category]
 *             properties:
 *               id_category: { type: integer }
 *     responses:
 *       200: { description: Association créée }
 *       401: { description: Non authentifié }
 *       403: { description: Accès refusé }
 * /pairings/{id}/categories/{id_category}:
 *   delete:
 *     summary: Supprime l'association accord-catégorie (ADMIN)
 *     tags: [Pairings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *       - { in: path, name: id_category, required: true, schema: { type: integer } }
 *     responses:
 *       200: { description: Association supprimée }
 *       401: { description: Non authentifié }
 *       403: { description: Accès refusé }
 */
router.delete('/:id/categories/:id_category', authenticate, requireAdmin, validate(categoryParamSchema, 'params'), deletePairingCategory);

export default router;
