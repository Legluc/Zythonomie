import { Router } from 'express';
import { z } from 'zod';
import { Role } from '@prisma/client';
import { validate } from '../middleware/validate';
import { deleteUser, getUserById, getUsers, postUser, putUser } from '../controllers/user.controller';

const router = Router();

const idParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
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

router.get('/', getUsers);
router.get('/:id', validate(idParamsSchema, 'params'), getUserById);
router.post('/', validate(userCreateSchema), postUser);
router.put('/:id', validate(idParamsSchema, 'params'), validate(userUpdateSchema), putUser);
router.delete('/:id', validate(idParamsSchema, 'params'), deleteUser);

export default router;
