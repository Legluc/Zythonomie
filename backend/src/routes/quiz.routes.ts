import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/authenticate';
import { requireAdmin } from '../middleware/require-admin';
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

router.get('/', authenticate, getQuizzes);
/**
 * @openapi
 * /quizzes:
 *   get:
 *     summary: Liste tous les quiz
 *     tags: [Quizzes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des quiz
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items: { $ref: '#/components/schemas/Quizz' }
 *       401: { description: Non authentifié }
 *   post:
 *     summary: Crée un quiz avec questions et choix (ADMIN)
 *     tags: [Quizzes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, description, questions]
 *             properties:
 *               name: { type: string, maxLength: 50 }
 *               description: { type: string }
 *               questions:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   required: [id_criterion, question, choices]
 *                   properties:
 *                     id_criterion: { type: integer }
 *                     question: { type: string, maxLength: 150 }
 *                     choices:
 *                       type: array
 *                       minItems: 2
 *                       items:
 *                         type: object
 *                         required: [choice, note_value]
 *                         properties:
 *                           choice: { type: string, maxLength: 100 }
 *                           note_value: { type: integer, minimum: 1, maximum: 5 }
 *     responses:
 *       201:
 *         description: Quiz créé
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/Quizz' }
 *       400: { description: Données invalides }
 *       401: { description: Non authentifié }
 *       403: { description: Accès refusé }
 */
router.get('/:id', authenticate, validate(idSchema, 'params'), getQuizById);
/**
 * @openapi
 * /quizzes/{id}:
 *   get:
 *     summary: Détail d'un quiz (avec questions et choix)
 *     tags: [Quizzes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     responses:
 *       200:
 *         description: Quiz trouvé
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/Quizz' }
 *       401: { description: Non authentifié }
 *       404: { description: Quiz introuvable }
 */
router.post('/', authenticate, requireAdmin, validate(quizCreateSchema), postQuiz);

export default router;
