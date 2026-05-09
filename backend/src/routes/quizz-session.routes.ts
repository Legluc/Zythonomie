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
/**
 * @openapi
 * /quizz-sessions:
 *   get:
 *     summary: Liste paginée des sessions de quiz (ADMIN)
 *     tags: [QuizzSessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: query, name: page, schema: { type: integer, default: 1 } }
 *       - { in: query, name: limit, schema: { type: integer, default: 20, maximum: 100 } }
 *     responses:
 *       200:
 *         description: Liste paginée
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
 *                           items: { $ref: '#/components/schemas/QuizzSession' }
 *                         meta: { $ref: '#/components/schemas/PaginationMeta' }
 *       401: { description: Non authentifié }
 *       403: { description: Accès refusé }
 *   post:
 *     summary: Démarre une nouvelle session de quiz
 *     tags: [QuizzSessions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [id_user, id_quizz]
 *             properties:
 *               id_user: { type: integer }
 *               id_quizz: { type: integer }
 *     responses:
 *       201:
 *         description: Session démarrée
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/QuizzSession' }
 *       400: { description: Données invalides }
 *       401: { description: Non authentifié }
 */
router.post('/', authenticate, validate(sessionStartSchema), postStartSession);
router.get('/:id', authenticate, validate(idSchema, 'params'), getSessionById);
/**
 * @openapi
 * /quizz-sessions/{id}:
 *   get:
 *     summary: Détail d'une session
 *     tags: [QuizzSessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     responses:
 *       200:
 *         description: Session trouvée
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/QuizzSession' }
 *       401: { description: Non authentifié }
 *       404: { description: Session introuvable }
 * /quizz-sessions/{id}/answers:
 *   post:
 *     summary: Enregistre une réponse dans la session
 *     tags: [QuizzSessions]
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
 *             required: [id_question_choice]
 *             properties:
 *               id_question_choice: { type: integer }
 *     responses:
 *       200:
 *         description: Réponse enregistrée
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ApiSuccess' }
 *       400: { description: Données invalides }
 *       401: { description: Non authentifié }
 *       404: { description: Session ou choix introuvable }
 * /quizz-sessions/{id}/complete:
 *   put:
 *     summary: Marque la session comme terminée et met à jour les UserCriteria
 *     tags: [QuizzSessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     responses:
 *       200:
 *         description: Session complétée
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/QuizzSession' }
 *       401: { description: Non authentifié }
 *       404: { description: Session introuvable }
 *       409: { description: Session déjà terminée }
 */
router.post('/:id/answers', authenticate, validate(idSchema, 'params'), validate(answerSchema), postSessionAnswer);
router.put('/:id/complete', authenticate, validate(idSchema, 'params'), putCompleteSession);

export default router;
