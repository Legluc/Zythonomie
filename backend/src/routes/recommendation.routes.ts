import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/authenticate';
import { requireOwnerOrAdmin } from '../middleware/require-owner-or-admin';
import { getRecommendations, postRefreshRecommendations } from '../controllers/recommendation.controller';

const router = Router();

const userIdSchema = z.object({
  userId: z.coerce.number().int().positive(),
});

const recommendationQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(50).optional(),
});

router.get(
  '/user/:userId',
  authenticate,
  requireOwnerOrAdmin('userId'),
  validate(userIdSchema, 'params'),
  validate(recommendationQuerySchema, 'query'),
  getRecommendations,
);
router.post(
  '/refresh/:userId',
  authenticate,
  requireOwnerOrAdmin('userId'),
  validate(userIdSchema, 'params'),
  validate(recommendationQuerySchema, 'query'),
  postRefreshRecommendations,
);

export default router;
