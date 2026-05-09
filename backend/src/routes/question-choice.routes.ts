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

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
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
  validate(paginationSchema, 'query'),
  getChoicesByQuestion,
);
/**
 * @openapi
 * /question-choices/by-question/{id_quizz_question}:
 *   get:
 *     summary: Choix d'une question (paginés)
 *     tags: [QuestionChoices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id_quizz_question, required: true, schema: { type: integer } }
 *       - { in: query, name: page, schema: { type: integer, default: 1 } }
 *       - { in: query, name: limit, schema: { type: integer, default: 20, maximum: 100 } }
 *     responses:
 *       200:
 *         description: Liste paginée des choix
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         data:
 *                           type: array
 *                           items: { $ref: '#/components/schemas/QuestionChoice' }
 *                         meta: { $ref: '#/components/schemas/PaginationMeta' }
 *       401: { description: Non authentifié }
 *       404: { description: Question introuvable }
 * /question-choices/{id}:
 *   get:
 *     summary: Détail d'un choix
 *     tags: [QuestionChoices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     responses:
 *       200:
 *         description: Choix trouvé
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/QuestionChoice' }
 *       401: { description: Non authentifié }
 *       404: { description: Choix introuvable }
 *   patch:
 *     summary: Met à jour un choix (ADMIN)
 *     tags: [QuestionChoices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               choice: { type: string, maxLength: 100 }
 *               note_value: { type: integer, minimum: 1, maximum: 5 }
 *     responses:
 *       200:
 *         description: Choix mis à jour
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/QuestionChoice' }
 *       400: { description: Données invalides }
 *       401: { description: Non authentifié }
 *       403: { description: Accès refusé }
 *       404: { description: Choix introuvable }
 *   delete:
 *     summary: Supprime un choix (ADMIN) — bloqué si des réponses existent
 *     tags: [QuestionChoices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     responses:
 *       200: { description: Supprimé }
 *       401: { description: Non authentifié }
 *       403: { description: Accès refusé }
 *       404: { description: Choix introuvable }
 *       409: { description: Des réponses existent pour ce choix }
 * /question-choices:
 *   post:
 *     summary: Crée un choix pour une question (ADMIN)
 *     tags: [QuestionChoices]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [id_quizz_question, choice, note_value]
 *             properties:
 *               id_quizz_question: { type: integer }
 *               choice: { type: string, maxLength: 100 }
 *               note_value: { type: integer, minimum: 1, maximum: 5 }
 *     responses:
 *       201:
 *         description: Choix créé
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/QuestionChoice' }
 *       400: { description: Données invalides }
 *       401: { description: Non authentifié }
 *       403: { description: Accès refusé }
 */

// GET /api/question-choices/:id
router.get('/:id', authenticate, validate(idParamsSchema, 'params'), getQuestionChoiceById);

// POST /api/question-choices  — ADMIN
router.post('/', authenticate, requireAdmin, validate(createSchema), postQuestionChoice);

// PATCH /api/question-choices/:id  — ADMIN
router.patch('/:id', authenticate, requireAdmin, validate(idParamsSchema, 'params'), validate(updateSchema), patchQuestionChoice);

// DELETE /api/question-choices/:id  — ADMIN
router.delete('/:id', authenticate, requireAdmin, validate(idParamsSchema, 'params'), deleteQuestionChoiceHandler);

export default router;
