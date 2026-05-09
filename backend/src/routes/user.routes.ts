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
router.get('/:id', authenticate, requireOwnerOrAdmin('id'), validate(idParamsSchema, 'params'), getUserById);
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
