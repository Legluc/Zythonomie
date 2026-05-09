import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/authenticate';
import { requireAdmin } from '../middleware/require-admin';
import {
  deleteBeerCriteriaHandler,
  getBeerCriteria,
  getBeerCriteriaEntry,
  putBeerCriteria,
} from '../controllers/beer-criteria.controller';

const router = Router();

const compositeParamsSchema = z.object({
  id_beer: z.coerce.number().int().positive(),
  id_criterion: z.coerce.number().int().positive(),
});

const beerParamsSchema = z.object({
  id_beer: z.coerce.number().int().positive(),
});

const scoreBodySchema = z.object({
  score: z.number().min(0).max(5),
});

// GET /api/beer-criteria/:id_beer              → authentifié
router.get('/:id_beer', authenticate, validate(beerParamsSchema, 'params'), getBeerCriteria);

// GET /api/beer-criteria/:id_beer/:id_criterion → authentifié
router.get(
  '/:id_beer/:id_criterion',
  authenticate,
  validate(compositeParamsSchema, 'params'),
  getBeerCriteriaEntry,
);

// PUT /api/beer-criteria/:id_beer/:id_criterion → ADMIN
router.put(
  '/:id_beer/:id_criterion',
  authenticate,
  requireAdmin,
  validate(compositeParamsSchema, 'params'),
  validate(scoreBodySchema),
  putBeerCriteria,
);

// DELETE /api/beer-criteria/:id_beer/:id_criterion — ADMIN
router.delete(
  '/:id_beer/:id_criterion',
  authenticate,
  requireAdmin,
  validate(compositeParamsSchema, 'params'),
  deleteBeerCriteriaHandler,
);

export default router;
