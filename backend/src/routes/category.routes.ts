import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/authenticate';
import { requireAdmin } from '../middleware/require-admin';
import {
  deleteCategoryHandler,
  getCategories,
  getCategoryById,
  postCategory,
  putCategory,
} from '../controllers/category.controller';

const router = Router();

const idParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

const categoryFiltersSchema = z.object({
  parentCategoryId: z.union([z.literal('null'), z.coerce.number().int().positive()]).optional(),
});

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const categoryQuerySchema = categoryFiltersSchema.merge(paginationSchema);

const categoryCreateSchema = z.object({
  name: z.string().trim().min(1).max(50),
  description: z.string().trim().min(1),
  id_parent_category: z.number().int().positive().nullable().optional(),
});

const categoryUpdateSchema = z
  .object({
    name: z.string().trim().min(1).max(50).optional(),
    description: z.string().trim().min(1).optional(),
    id_parent_category: z.number().int().positive().nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Au moins un champ est requis pour la mise a jour',
  });

router.get('/', authenticate, validate(categoryQuerySchema, 'query'), getCategories);
/**
 * @openapi
 * /categories:
 *   get:
 *     summary: Liste paginée des catégories
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: query, name: page, schema: { type: integer, default: 1 } }
 *       - { in: query, name: limit, schema: { type: integer, default: 20, maximum: 100 } }
 *       - { in: query, name: parentCategoryId, description: "'null' pour les catégories racines", schema: { type: string } }
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
 *                           items: { $ref: '#/components/schemas/Category' }
 *                         meta: { $ref: '#/components/schemas/PaginationMeta' }
 *       401: { description: Non authentifié }
 *   post:
 *     summary: Crée une catégorie (ADMIN)
 *     tags: [Categories]
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
 *               id_parent_category: { type: integer, nullable: true }
 *     responses:
 *       201:
 *         description: Catégorie créée
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/Category' }
 *       400: { description: Données invalides }
 *       401: { description: Non authentifié }
 *       403: { description: Accès refusé }
 */
router.get('/:id', authenticate, validate(idParamsSchema, 'params'), getCategoryById);
/**
 * @openapi
 * /categories/{id}:
 *   get:
 *     summary: Détail d'une catégorie
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     responses:
 *       200:
 *         description: Catégorie trouvée
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/Category' }
 *       401: { description: Non authentifié }
 *       404: { description: Catégorie introuvable }
 *   put:
 *     summary: Met à jour une catégorie (ADMIN)
 *     tags: [Categories]
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
 *               id_parent_category: { type: integer, nullable: true }
 *     responses:
 *       200:
 *         description: Catégorie mise à jour
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/Category' }
 *       400: { description: Données invalides }
 *       401: { description: Non authentifié }
 *       403: { description: Accès refusé }
 *       404: { description: Catégorie introuvable }
 *   delete:
 *     summary: Supprime une catégorie (ADMIN)
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     responses:
 *       200: { description: Supprimée }
 *       401: { description: Non authentifié }
 *       403: { description: Accès refusé }
 *       404: { description: Catégorie introuvable }
 *       409: { description: Catégorie liée à des bières ou sous-catégories }
 */
router.post('/', authenticate, requireAdmin, validate(categoryCreateSchema), postCategory);
router.put('/:id', authenticate, requireAdmin, validate(idParamsSchema, 'params'), validate(categoryUpdateSchema), putCategory);
router.delete('/:id', authenticate, requireAdmin, validate(idParamsSchema, 'params'), deleteCategoryHandler);

export default router;
