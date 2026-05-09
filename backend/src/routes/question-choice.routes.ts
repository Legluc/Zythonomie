import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/authenticate';
import { requireAdmin } from '../middleware/require-admin';
import {
  deleteQuestionChoiceHandler,
  getChoicesByQuestion,
  getQuestionChoiceById,
  patchQuestionChoice,
  postQuestionChoice,
} from '../controllers/question-choice.controller';

const router = Router();

const idParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

const questionIdParamsSchema = z.object({
  id_quizz_question: z.coerce.number().int().positive(),
});

const createSchema = z.object({
  id_quizz_question: z.number().int().positive(),
  choice: z.string().trim().min(1).max(100),
  note_value: z.number().int(),
});

const updateSchema = z
  .object({
    choice: z.string().trim().min(1).max(100).optional(),
    note_value: z.number().int().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Au moins un champ est requis pour la mise à jour',
  });

// GET /api/question-choices/by-question/:id_quizz_question
router.get(
  '/by-question/:id_quizz_question',
  authenticate,
  validate(questionIdParamsSchema, 'params'),
  getChoicesByQuestion,
);

// GET /api/question-choices/:id
router.get('/:id', authenticate, validate(idParamsSchema, 'params'), getQuestionChoiceById);

// POST /api/question-choices  — ADMIN
router.post('/', authenticate, requireAdmin, validate(createSchema), postQuestionChoice);

// PATCH /api/question-choices/:id  — ADMIN
router.patch('/:id', authenticate, requireAdmin, validate(idParamsSchema, 'params'), validate(updateSchema), patchQuestionChoice);

// DELETE /api/question-choices/:id  — ADMIN
router.delete('/:id', authenticate, requireAdmin, validate(idParamsSchema, 'params'), deleteQuestionChoiceHandler);

export default router;
