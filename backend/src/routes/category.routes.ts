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

router.get('/', authenticate, validate(categoryFiltersSchema, 'query'), getCategories);
router.get('/:id', authenticate, validate(idParamsSchema, 'params'), getCategoryById);
router.post('/', authenticate, requireAdmin, validate(categoryCreateSchema), postCategory);
router.put('/:id', authenticate, requireAdmin, validate(idParamsSchema, 'params'), validate(categoryUpdateSchema), putCategory);
router.delete('/:id', authenticate, requireAdmin, validate(idParamsSchema, 'params'), deleteCategoryHandler);

export default router;
