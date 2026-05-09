import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/authenticate';
import {
  deleteRating,
  getRatingsByBeer,
  getRatingsByUser,
  postRating,
  putRating,
} from '../controllers/rating.controller';

const router = Router();

const idSchema = z.object({
  id: z.coerce.number().int().positive(),
});

const beerIdSchema = z.object({
  beerId: z.coerce.number().int().positive(),
});

const userIdSchema = z.object({
  userId: z.coerce.number().int().positive(),
});

const createRatingSchema = z.object({
  id_user: z.number().int().positive(),
  id_beer: z.number().int().positive(),
  content: z.string().trim().min(1),
  rate: z.number().int().min(1).max(5),
});

const updateRatingSchema = z
  .object({
    content: z.string().trim().min(1).optional(),
    rate: z.number().int().min(1).max(5).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Au moins un champ est requis pour la mise a jour',
  });

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

router.get('/beer/:beerId', authenticate, validate(beerIdSchema, 'params'), validate(paginationSchema, 'query'), getRatingsByBeer);
/**
 * @openapi
 * /ratings/beer/{beerId}:
 *   get:
 *     summary: Notes d'une bière (paginées)
 *     tags: [Ratings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: beerId, required: true, schema: { type: integer } }
 *       - { in: query, name: page, schema: { type: integer, default: 1 } }
 *       - { in: query, name: limit, schema: { type: integer, default: 20, maximum: 100 } }
 *     responses:
 *       200:
 *         description: Liste paginée des notes
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
 *                           items: { $ref: '#/components/schemas/Rating' }
 *                         meta: { $ref: '#/components/schemas/PaginationMeta' }
 *       401: { description: Non authentifié }
 * /ratings/user/{userId}:
 *   get:
 *     summary: Notes d'un utilisateur (paginées)
 *     tags: [Ratings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: userId, required: true, schema: { type: integer } }
 *       - { in: query, name: page, schema: { type: integer, default: 1 } }
 *       - { in: query, name: limit, schema: { type: integer, default: 20, maximum: 100 } }
 *     responses:
 *       200:
 *         description: Liste paginée des notes
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
 *                           items: { $ref: '#/components/schemas/Rating' }
 *                         meta: { $ref: '#/components/schemas/PaginationMeta' }
 *       401: { description: Non authentifié }
 */
router.get('/user/:userId', authenticate, validate(userIdSchema, 'params'), validate(paginationSchema, 'query'), getRatingsByUser);
router.post('/', authenticate, validate(createRatingSchema), postRating);
/**
 * @openapi
 * /ratings:
 *   post:
 *     summary: Crée une note pour une bière
 *     tags: [Ratings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [id_user, id_beer, content, rate]
 *             properties:
 *               id_user: { type: integer }
 *               id_beer: { type: integer }
 *               content: { type: string }
 *               rate: { type: integer, minimum: 1, maximum: 5 }
 *     responses:
 *       201:
 *         description: Note créée
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/Rating' }
 *       400: { description: Données invalides }
 *       401: { description: Non authentifié }
 *       409: { description: Note déjà existante pour ce couple utilisateur-bière }
 * /ratings/{id}:
 *   put:
 *     summary: Met à jour une note (propriétaire ou ADMIN)
 *     tags: [Ratings]
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
 *               content: { type: string }
 *               rate: { type: integer, minimum: 1, maximum: 5 }
 *     responses:
 *       200:
 *         description: Note mise à jour
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/Rating' }
 *       400: { description: Données invalides }
 *       401: { description: Non authentifié }
 *       403: { description: Accès refusé }
 *       404: { description: Note introuvable }
 *   delete:
 *     summary: Supprime (soft delete) une note (propriétaire ou ADMIN)
 *     tags: [Ratings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     responses:
 *       200: { description: Supprimée }
 *       401: { description: Non authentifié }
 *       403: { description: Accès refusé }
 *       404: { description: Note introuvable }
 */
// Propriétaire ou admin : la vérification se fait dans le service via req.user
router.put('/:id', authenticate, validate(idSchema, 'params'), validate(updateRatingSchema), putRating);
router.delete('/:id', authenticate, validate(idSchema, 'params'), deleteRating);

export default router;
