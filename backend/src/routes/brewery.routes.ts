import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/authenticate';
import { requireAdmin } from '../middleware/require-admin';
import {
  deleteBreweryHandler,
  getBreweries,
  getBreweryById,
  postBrewery,
  putBrewery,
} from '../controllers/brewery.controller';

const router = Router();

const idParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const breweryCreateSchema = z.object({
  name: z.string().trim().min(1).max(50),
  description: z.string().trim().min(1),
  image: z.string().trim().min(1).max(255),
  origin_date: z.coerce.date(),
});

const breweryUpdateSchema = z
  .object({
    name: z.string().trim().min(1).max(50).optional(),
    description: z.string().trim().min(1).optional(),
    image: z.string().trim().min(1).max(255).optional(),
    origin_date: z.coerce.date().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Au moins un champ est requis pour la mise a jour',
  });

router.get('/', authenticate, validate(paginationSchema, 'query'), getBreweries);
/**
 * @openapi
 * /breweries:
 *   get:
 *     summary: Liste paginée des brasseries
 *     tags: [Breweries]
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
 *                           items: { $ref: '#/components/schemas/Brewery' }
 *                         meta: { $ref: '#/components/schemas/PaginationMeta' }
 *       401: { description: Non authentifié }
 *   post:
 *     summary: Crée une brasserie (ADMIN)
 *     tags: [Breweries]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, description, image, origin_date]
 *             properties:
 *               name: { type: string, maxLength: 50 }
 *               description: { type: string }
 *               image: { type: string, maxLength: 255 }
 *               origin_date: { type: string, format: date-time }
 *     responses:
 *       201:
 *         description: Brasserie créée
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/Brewery' }
 *       400: { description: Données invalides }
 *       401: { description: Non authentifié }
 *       403: { description: Accès refusé }
 */
router.get('/:id', authenticate, validate(idParamsSchema, 'params'), getBreweryById);
/**
 * @openapi
 * /breweries/{id}:
 *   get:
 *     summary: Détail d'une brasserie
 *     tags: [Breweries]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     responses:
 *       200:
 *         description: Brasserie trouvée
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/Brewery' }
 *       401: { description: Non authentifié }
 *       404: { description: Brasserie introuvable }
 *   put:
 *     summary: Met à jour une brasserie (ADMIN)
 *     tags: [Breweries]
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
 *               image: { type: string }
 *               origin_date: { type: string, format: date-time }
 *     responses:
 *       200:
 *         description: Brasserie mise à jour
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/Brewery' }
 *       400: { description: Données invalides }
 *       401: { description: Non authentifié }
 *       403: { description: Accès refusé }
 *       404: { description: Brasserie introuvable }
 *   delete:
 *     summary: Supprime une brasserie (ADMIN)
 *     tags: [Breweries]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     responses:
 *       200: { description: Supprimée }
 *       401: { description: Non authentifié }
 *       403: { description: Accès refusé }
 *       404: { description: Brasserie introuvable }
 */
router.post('/', authenticate, requireAdmin, validate(breweryCreateSchema), postBrewery);
router.put('/:id', authenticate, requireAdmin, validate(idParamsSchema, 'params'), validate(breweryUpdateSchema), putBrewery);
router.delete('/:id', authenticate, requireAdmin, validate(idParamsSchema, 'params'), deleteBreweryHandler);

export default router;
