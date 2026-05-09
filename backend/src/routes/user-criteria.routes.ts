import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/authenticate';
import { requireOwnerOrAdmin } from '../middleware/require-owner-or-admin';
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

// GET /api/user-criteria/:id_user              → propriétaire ou admin
router.get('/:id_user', authenticate, requireOwnerOrAdmin('id_user'), validate(userParamsSchema, 'params'), getUserCriteria);

// GET /api/user-criteria/:id_user/:id_criterion → propriétaire ou admin
router.get(
  '/:id_user/:id_criterion',
  authenticate,
  requireOwnerOrAdmin('id_user'),
  validate(compositeParamsSchema, 'params'),
  getUserCriteriaEntry,
);

// PUT /api/user-criteria/:id_user/:id_criterion → propriétaire ou admin
router.put(
  '/:id_user/:id_criterion',
  authenticate,
  requireOwnerOrAdmin('id_user'),
  validate(compositeParamsSchema, 'params'),
  validate(scoreBodySchema),
  putUserCriteria,
);

// DELETE /api/user-criteria/:id_user/:id_criterion → propriétaire ou admin
router.delete(
  '/:id_user/:id_criterion',
  authenticate,
  requireOwnerOrAdmin('id_user'),
  validate(compositeParamsSchema, 'params'),
  deleteUserCriteriaHandler,
);

export default router;
