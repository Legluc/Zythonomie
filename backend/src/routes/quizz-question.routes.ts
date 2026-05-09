import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/authenticate';
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
router.get('/by-quizz/:id_quizz', authenticate, validate(quizzIdParamsSchema, 'params'), getQuestionsByQuizz);
/**
 * @openapi
 * /quizz-questions/by-quizz/{id_quizz}:
 *   get:
 *     summary: Questions d'un quiz
 *     tags: [QuizzQuestions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id_quizz, required: true, schema: { type: integer } }
 *     responses:
 *       200:
 *         description: Liste des questions
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items: { $ref: '#/components/schemas/QuizzQuestion' }
 *       401: { description: Non authentifié }
 *       404: { description: Quiz introuvable }
 * /quizz-questions/{id}:
 *   get:
 *     summary: Détail d'une question
 *     tags: [QuizzQuestions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     responses:
 *       200:
 *         description: Question trouvée
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/QuizzQuestion' }
 *       401: { description: Non authentifié }
 *       404: { description: Question introuvable }
 *   patch:
 *     summary: Met à jour une question (ADMIN)
 *     tags: [QuizzQuestions]
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
 *               id_criterion: { type: integer }
 *               question: { type: string, maxLength: 150 }
 *     responses:
 *       200:
 *         description: Question mise à jour
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/QuizzQuestion' }
 *       400: { description: Données invalides }
 *       401: { description: Non authentifié }
 *       403: { description: Accès refusé }
 *       404: { description: Question introuvable }
 *   delete:
 *     summary: Supprime une question (ADMIN) — bloqué si des réponses existent
 *     tags: [QuizzQuestions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     responses:
 *       200: { description: Supprimée }
 *       401: { description: Non authentifié }
 *       403: { description: Accès refusé }
 *       404: { description: Question introuvable }
 *       409: { description: Des réponses existent pour cette question }
 * /quizz-questions:
 *   post:
 *     summary: Crée une question de quiz (ADMIN)
 *     tags: [QuizzQuestions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [id_quizz, id_criterion, question]
 *             properties:
 *               id_quizz: { type: integer }
 *               id_criterion: { type: integer }
 *               question: { type: string, maxLength: 150 }
 *     responses:
 *       201:
 *         description: Question créée
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/QuizzQuestion' }
 *       400: { description: Données invalides }
 *       401: { description: Non authentifié }
 *       403: { description: Accès refusé }
 */

// GET /api/quizz-questions/:id
router.get('/:id', authenticate, validate(idParamsSchema, 'params'), getQuizzQuestionById);

// POST /api/quizz-questions  — ADMIN
router.post('/', authenticate, requireAdmin, validate(createSchema), postQuizzQuestion);

// PATCH /api/quizz-questions/:id  — ADMIN
router.patch('/:id', authenticate, requireAdmin, validate(idParamsSchema, 'params'), validate(updateSchema), patchQuizzQuestion);

// DELETE /api/quizz-questions/:id  — ADMIN
router.delete('/:id', requireAdmin, validate(idParamsSchema, 'params'), deleteQuizzQuestionHandler);

export default router;
