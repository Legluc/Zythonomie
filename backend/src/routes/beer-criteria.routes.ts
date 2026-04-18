import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
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

// GET /api/beer-criteria/:id_beer              → tous les critères d'une bière
router.get('/:id_beer', validate(beerParamsSchema, 'params'), getBeerCriteria);

// GET /api/beer-criteria/:id_beer/:id_criterion → un critère précis
router.get(
  '/:id_beer/:id_criterion',
  validate(compositeParamsSchema, 'params'),
  getBeerCriteriaEntry,
);

// PUT /api/beer-criteria/:id_beer/:id_criterion → créer ou mettre à jour (upsert) — ADMIN
router.put(
  '/:id_beer/:id_criterion',
  requireAdmin,
  validate(compositeParamsSchema, 'params'),
  validate(scoreBodySchema),
  putBeerCriteria,
);

// DELETE /api/beer-criteria/:id_beer/:id_criterion — ADMIN
router.delete(
  '/:id_beer/:id_criterion',
  requireAdmin,
  validate(compositeParamsSchema, 'params'),
  deleteBeerCriteriaHandler,
);

export default router;
