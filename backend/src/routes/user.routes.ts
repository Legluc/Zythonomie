import { Router } from 'express';
import { z } from 'zod';
import { Role } from '@prisma/client';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/authenticate';
import { requireAdmin } from '../middleware/require-admin';
import { requireOwnerOrAdmin } from '../middleware/require-owner-or-admin';
import { deleteUser, getUserById, getUsers, postUser, putUser } from '../controllers/user.controller';

const router = Router();

const idParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const userCreateSchema = z.object({
  name: z.string().trim().min(1).max(50),
  firstname: z.string().trim().min(1).max(50),
  mail: z.string().trim().email().max(255),
  password: z.string().min(8).max(255),
  birthday: z.string().date(),
  adress: z.string().trim().min(1).max(255),
  icon: z.string().trim().max(255).optional(),
  role: z.nativeEnum(Role).optional(),
});

const userUpdateSchema = z
  .object({
    name: z.string().trim().min(1).max(50).optional(),
    firstname: z.string().trim().min(1).max(50).optional(),
    mail: z.string().trim().email().max(255).optional(),
    password: z.string().min(8).max(255).optional(),
    birthday: z.string().date().optional(),
    adress: z.string().trim().min(1).max(255).optional(),
    icon: z.string().trim().max(255).optional(),
    role: z.nativeEnum(Role).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Au moins un champ est requis pour la mise a jour',
  });

router.get('/', authenticate, requireAdmin, validate(paginationSchema, 'query'), getUsers);
/**
 * @openapi
 * /users:
 *   get:
 *     summary: Liste paginée des utilisateurs (ADMIN)
 *     tags: [Users]
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
 *                           items: { $ref: '#/components/schemas/User' }
 *                         meta: { $ref: '#/components/schemas/PaginationMeta' }
 *       401: { description: Non authentifié }
 *       403: { description: Accès refusé }
 *   post:
 *     summary: Crée un utilisateur (ADMIN)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, firstname, mail, password, birthday, adress]
 *             properties:
 *               name: { type: string }
 *               firstname: { type: string }
 *               mail: { type: string, format: email }
 *               password: { type: string, minLength: 8 }
 *               birthday: { type: string, format: date }
 *               adress: { type: string }
 *               icon: { type: string }
 *               role: { type: string, enum: [USER, ADMIN] }
 *     responses:
 *       201:
 *         description: Utilisateur créé
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/User' }
 *       400: { description: Données invalides }
 *       401: { description: Non authentifié }
 *       403: { description: Accès refusé }
 *       409: { description: Email déjà utilisé }
 */
router.get('/:id', authenticate, requireOwnerOrAdmin('id'), validate(idParamsSchema, 'params'), getUserById);
/**
 * @openapi
 * /users/{id}:
 *   get:
 *     summary: Profil d'un utilisateur (propriétaire ou ADMIN)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
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
 *       401: { description: Non authentifié }
 *       403: { description: Accès refusé }
 *       404: { description: Utilisateur introuvable }
 *   put:
 *     summary: Met à jour un utilisateur (propriétaire ou ADMIN)
 *     tags: [Users]
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
 *               firstname: { type: string }
 *               mail: { type: string, format: email }
 *               password: { type: string, minLength: 8 }
 *               birthday: { type: string, format: date }
 *               adress: { type: string }
 *               icon: { type: string }
 *     responses:
 *       200:
 *         description: Utilisateur mis à jour
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/User' }
 *       400: { description: Données invalides }
 *       401: { description: Non authentifié }
 *       403: { description: Accès refusé }
 *       404: { description: Utilisateur introuvable }
 *   delete:
 *     summary: Supprime (soft delete) un utilisateur (propriétaire ou ADMIN)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     responses:
 *       200: { description: Supprimé }
 *       401: { description: Non authentifié }
 *       403: { description: Accès refusé }
 *       404: { description: Utilisateur introuvable }
 */
// Création directe d'utilisateur réservée à l'admin (l'inscription publique passe par /api/auth/register)
router.post('/', authenticate, requireAdmin, validate(userCreateSchema), postUser);
// Propriétaire ou admin — le champ `role` est ignoré si non admin (middleware inline)
router.put(
  '/:id',
  authenticate,
  requireOwnerOrAdmin('id'),
  (req, _res, next) => {
    if (req.user?.role !== 'ADMIN') delete req.body.role;
    next();
  },
  validate(idParamsSchema, 'params'),
  validate(userUpdateSchema),
  putUser,
);
router.delete('/:id', authenticate, requireOwnerOrAdmin('id'), validate(idParamsSchema, 'params'), deleteUser);

export default router;
