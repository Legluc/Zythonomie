import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import {
  deleteUserCriteriaHandler,
  getUserCriteria,
  getUserCriteriaEntry,
  putUserCriteria,
} from '../controllers/user-criteria.controller';

const router = Router();

const compositeParamsSchema = z.object({
  id_user: z.coerce.number().int().positive(),
  id_criterion: z.coerce.number().int().positive(),
});

const userParamsSchema = z.object({
  id_user: z.coerce.number().int().positive(),
});

const scoreBodySchema = z.object({
  score: z.number().min(0).max(5),
});

// GET /api/user-criteria/:id_user              → tous les critères d'un user
router.get('/:id_user', validate(userParamsSchema, 'params'), getUserCriteria);

// GET /api/user-criteria/:id_user/:id_criterion → un critère précis
router.get(
  '/:id_user/:id_criterion',
  validate(compositeParamsSchema, 'params'),
  getUserCriteriaEntry,
);

// PUT /api/user-criteria/:id_user/:id_criterion → créer ou mettre à jour (upsert)
router.put(
  '/:id_user/:id_criterion',
  validate(compositeParamsSchema, 'params'),
  validate(scoreBodySchema),
  putUserCriteria,
);

// DELETE /api/user-criteria/:id_user/:id_criterion
router.delete(
  '/:id_user/:id_criterion',
  validate(compositeParamsSchema, 'params'),
  deleteUserCriteriaHandler,
);

export default router;
