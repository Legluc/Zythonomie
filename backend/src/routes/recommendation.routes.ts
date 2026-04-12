import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { getRecommendations, postRefreshRecommendations } from '../controllers/recommendation.controller';

const router = Router();

const userIdSchema = z.object({
  userId: z.coerce.number().int().positive(),
});

const recommendationQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(50).optional(),
});

router.get('/user/:userId', validate(userIdSchema, 'params'), validate(recommendationQuerySchema, 'query'), getRecommendations);
router.post(
  '/refresh/:userId',
  validate(userIdSchema, 'params'),
  validate(recommendationQuerySchema, 'query'),
  postRefreshRecommendations,
);

export default router;
