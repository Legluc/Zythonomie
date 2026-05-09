import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/authenticate';
import { requireAdmin } from '../middleware/require-admin';
import { deleteBeer, getBeerById, getBeers, postBeer, putBeer,
  postBeerBrewery, deleteBeerBrewery, postBeerCategory, deleteBeerCategory,
} from '../controllers/beer.controller';

const router = Router();

// ─── Schémas de validation ────────────────────────────────────────────────────

const idParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

const beerFiltersSchema = z.object({
  alcool: z.enum(['true', 'false']).optional(),
  breweryId: z.coerce.number().int().positive().optional(),
  categoryId: z.coerce.number().int().positive().optional(),
});

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const beerQuerySchema = beerFiltersSchema.merge(paginationSchema);

const beerCreateSchema = z.object({
  name: z.string().trim().min(1).max(50),
  description: z.string().trim().min(1),
  alcool: z.boolean(),
  percentage_alcool: z.number().min(0).max(100),
  EAN: z.number().int().positive(),
  image: z.string().trim().min(1).max(255),
  brewery_ids: z.array(z.number().int().positive()).optional(),
  category_ids: z.array(z.number().int().positive()).optional(),
});

const beerUpdateSchema = z
  .object({
    name: z.string().trim().min(1).max(50).optional(),
    description: z.string().trim().min(1).optional(),
    alcool: z.boolean().optional(),
    percentage_alcool: z.number().min(0).max(100).optional(),
    EAN: z.number().int().positive().optional(),
    image: z.string().trim().min(1).max(255).optional(),
    brewery_ids: z.array(z.number().int().positive()).optional(),
    category_ids: z.array(z.number().int().positive()).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Au moins un champ est requis pour la mise à jour',
  });

// ─── Routes ───────────────────────────────────────────────────────────────────

router.get('/', authenticate, validate(beerQuerySchema, 'query'), getBeers);
/**
 * @openapi
 * /beers:
 *   get:
 *     summary: Liste paginée des bières
 *     tags: [Beers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: query, name: page, schema: { type: integer, default: 1 } }
 *       - { in: query, name: limit, schema: { type: integer, default: 20, maximum: 100 } }
 *       - { in: query, name: alcool, schema: { type: string, enum: [true, false] } }
 *       - { in: query, name: breweryId, schema: { type: integer } }
 *       - { in: query, name: categoryId, schema: { type: integer } }
 *     responses:
 *       200:
 *         description: Liste paginée des bières
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
 *                           items: { $ref: '#/components/schemas/Beer' }
 *                         meta: { $ref: '#/components/schemas/PaginationMeta' }
 *       401: { description: Non authentifié }
 *   post:
 *     summary: Crée une bière (ADMIN)
 *     tags: [Beers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, description, alcool, percentage_alcool, EAN, image]
 *             properties:
 *               name: { type: string, maxLength: 50 }
 *               description: { type: string }
 *               alcool: { type: boolean }
 *               percentage_alcool: { type: number, minimum: 0, maximum: 100 }
 *               EAN: { type: integer }
 *               image: { type: string, maxLength: 255 }
 *               brewery_ids: { type: array, items: { type: integer } }
 *               category_ids: { type: array, items: { type: integer } }
 *     responses:
 *       201:
 *         description: Bière créée
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/Beer' }
 *       400: { description: Données invalides }
 *       401: { description: Non authentifié }
 *       403: { description: Accès refusé }
 */
router.get('/:id', validate(idParamsSchema, 'params'), authenticate, getBeerById);
/**
 * @openapi
 * /beers/{id}:
 *   get:
 *     summary: Détail d'une bière
 *     tags: [Beers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     responses:
 *       200:
 *         description: Bière trouvée
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/Beer' }
 *       401: { description: Non authentifié }
 *       404: { description: Bière introuvable }
 *   put:
 *     summary: Met à jour une bière (ADMIN)
 *     tags: [Beers]
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
 *               alcool: { type: boolean }
 *               percentage_alcool: { type: number }
 *               EAN: { type: integer }
 *               image: { type: string }
 *               brewery_ids: { type: array, items: { type: integer } }
 *               category_ids: { type: array, items: { type: integer } }
 *     responses:
 *       200:
 *         description: Bière mise à jour
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/Beer' }
 *       400: { description: Données invalides }
 *       401: { description: Non authentifié }
 *       403: { description: Accès refusé }
 *       404: { description: Bière introuvable }
 *   delete:
 *     summary: Supprime (soft delete) une bière (ADMIN)
 *     tags: [Beers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     responses:
 *       200: { description: Supprimée }
 *       401: { description: Non authentifié }
 *       403: { description: Accès refusé }
 *       404: { description: Bière introuvable }
 */
router.post('/', authenticate, requireAdmin, validate(beerCreateSchema), postBeer);
router.put('/:id', authenticate, requireAdmin, validate(idParamsSchema, 'params'), validate(beerUpdateSchema), putBeer);
router.delete('/:id', authenticate, requireAdmin, validate(idParamsSchema, 'params'), deleteBeer);

// ─── Liaisons atomiques ───────────────────────────────────────────────────────

const breweryLinkSchema = z.object({ id_brewery: z.number().int().positive() });
const categoryLinkSchema = z.object({ id_category: z.number().int().positive() });
const breweryParamSchema = z.object({ id: z.coerce.number().int().positive(), id_brewery: z.coerce.number().int().positive() });
const categoryParamSchema = z.object({ id: z.coerce.number().int().positive(), id_category: z.coerce.number().int().positive() });

router.post('/:id/breweries', authenticate, requireAdmin, validate(idParamsSchema, 'params'), validate(breweryLinkSchema), postBeerBrewery);
/**
 * @openapi
 * /beers/{id}/breweries:
 *   post:
 *     summary: Associe une brasserie à une bière (ADMIN)
 *     tags: [Beers]
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
 *             required: [id_brewery]
 *             properties:
 *               id_brewery: { type: integer }
 *     responses:
 *       200: { description: Association créée }
 *       401: { description: Non authentifié }
 *       403: { description: Accès refusé }
 *       404: { description: Bière ou brasserie introuvable }
 * /beers/{id}/breweries/{id_brewery}:
 *   delete:
 *     summary: Supprime l'association bière-brasserie (ADMIN)
 *     tags: [Beers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *       - { in: path, name: id_brewery, required: true, schema: { type: integer } }
 *     responses:
 *       200: { description: Association supprimée }
 *       401: { description: Non authentifié }
 *       403: { description: Accès refusé }
 * /beers/{id}/categories:
 *   post:
 *     summary: Associe une catégorie à une bière (ADMIN)
 *     tags: [Beers]
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
 * /beers/{id}/categories/{id_category}:
 *   delete:
 *     summary: Supprime l'association bière-catégorie (ADMIN)
 *     tags: [Beers]
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
router.delete('/:id/breweries/:id_brewery', authenticate, requireAdmin, validate(breweryParamSchema, 'params'), deleteBeerBrewery);
router.post('/:id/categories', authenticate, requireAdmin, validate(idParamsSchema, 'params'), validate(categoryLinkSchema), postBeerCategory);
router.delete('/:id/categories/:id_category', authenticate, requireAdmin, validate(categoryParamSchema, 'params'), deleteBeerCategory);

export default router;
