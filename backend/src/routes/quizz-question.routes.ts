import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { requireAdmin } from '../middleware/require-admin';
import {
  deleteQuizzQuestionHandler,
  getQuestionsByQuizz,
  getQuizzQuestionById,
  patchQuizzQuestion,
  postQuizzQuestion,
} from '../controllers/quizz-question.controller';

const router = Router();

const idParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

const quizzIdParamsSchema = z.object({
  id_quizz: z.coerce.number().int().positive(),
});

const createSchema = z.object({
  id_quizz: z.number().int().positive(),
  id_criterion: z.number().int().positive(),
  question: z.string().trim().min(1).max(150),
});

const updateSchema = z
  .object({
    id_criterion: z.number().int().positive().optional(),
    question: z.string().trim().min(1).max(150).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Au moins un champ est requis pour la mise à jour',
  });

// GET /api/quizz-questions/by-quizz/:id_quizz  → toutes les questions d'un quiz
router.get('/by-quizz/:id_quizz', validate(quizzIdParamsSchema, 'params'), getQuestionsByQuizz);

// GET /api/quizz-questions/:id
router.get('/:id', validate(idParamsSchema, 'params'), getQuizzQuestionById);

// POST /api/quizz-questions  — ADMIN
router.post('/', requireAdmin, validate(createSchema), postQuizzQuestion);

// PATCH /api/quizz-questions/:id  — ADMIN
router.patch('/:id', requireAdmin, validate(idParamsSchema, 'params'), validate(updateSchema), patchQuizzQuestion);

// DELETE /api/quizz-questions/:id  — ADMIN
router.delete('/:id', requireAdmin, validate(idParamsSchema, 'params'), deleteQuizzQuestionHandler);

export default router;
