import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/authenticate';
import { requireAdmin } from '../middleware/require-admin';
import {
  getSessions,
  getSessionById,
  postSessionAnswer,
  postStartSession,
  putCompleteSession,
} from '../controllers/quizz-session.controller';

const router = Router();

const idSchema = z.object({
  id: z.coerce.number().int().positive(),
});

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const sessionStartSchema = z.object({
  id_user: z.number().int().positive(),
  id_quizz: z.number().int().positive(),
});

const answerSchema = z.object({
  id_question_choice: z.number().int().positive(),
});

router.get('/', authenticate, requireAdmin, validate(paginationSchema, 'query'), getSessions);
router.post('/', authenticate, validate(sessionStartSchema), postStartSession);
router.get('/:id', authenticate, validate(idSchema, 'params'), getSessionById);
router.post('/:id/answers', authenticate, validate(idSchema, 'params'), validate(answerSchema), postSessionAnswer);
router.put('/:id/complete', authenticate, validate(idSchema, 'params'), putCompleteSession);

export default router;
