import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
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

// Lecture publique
router.get('/', getCriteria);
router.get('/:id', validate(idParamsSchema, 'params'), getCriterionById);

// Mutations réservées aux admins
router.post('/', requireAdmin, validate(criterionCreateSchema), postCriterion);
router.patch('/:id', requireAdmin, validate(idParamsSchema, 'params'), validate(criterionUpdateSchema), patchCriterion);
router.delete('/:id', requireAdmin, validate(idParamsSchema, 'params'), deleteCriterionHandler);

export default router;
