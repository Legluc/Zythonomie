import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { getQuizById, getQuizzes, postQuiz } from '../controllers/quiz.controller';

const router = Router();

const idSchema = z.object({
  id: z.coerce.number().int().positive(),
});

const quizCreateSchema = z.object({
  name: z.string().trim().min(1).max(50),
  description: z.string().trim().min(1),
  questions: z.array(
    z.object({
      id_criterion: z.number().int().positive(),
      question: z.string().trim().min(1).max(150),
      choices: z
        .array(
          z.object({
            choice: z.string().trim().min(1).max(100),
            note_value: z.number().int().min(1).max(5),
          }),
        )
        .min(2),
    }),
  ).min(1),
});

router.get('/', getQuizzes);
router.get('/:id', validate(idSchema, 'params'), getQuizById);
router.post('/', validate(quizCreateSchema), postQuiz);

export default router;
