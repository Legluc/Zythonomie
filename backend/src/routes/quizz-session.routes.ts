import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import {
  getSessionById,
  postSessionAnswer,
  postStartSession,
  putCompleteSession,
} from '../controllers/quizz-session.controller';

const router = Router();

const idSchema = z.object({
  id: z.coerce.number().int().positive(),
});

const sessionStartSchema = z.object({
  id_user: z.number().int().positive(),
  id_quizz: z.number().int().positive(),
});

const answerSchema = z.object({
  id_question_choice: z.number().int().positive(),
});

router.post('/', validate(sessionStartSchema), postStartSession);
router.get('/:id', validate(idSchema, 'params'), getSessionById);
router.post('/:id/answers', validate(idSchema, 'params'), validate(answerSchema), postSessionAnswer);
router.put('/:id/complete', validate(idSchema, 'params'), putCompleteSession);

export default router;
