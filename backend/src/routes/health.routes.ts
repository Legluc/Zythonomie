import { Router } from 'express';
import { sendSuccess } from '../lib/response';

const router = Router();

router.get('/', (_req, res) => {
  sendSuccess(res, 200, {
    status: 'ok',
    message: 'Zythonomie API is running',
  });
});
/**
 * @openapi
 * /health:
 *   get:
 *     summary: Vérification de l'état de l'API
 *     tags: [Health]
 *     servers:
 *       - url: ''
 *     responses:
 *       200:
 *         description: API opérationnelle
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     status: { type: string, example: ok }
 *                     message: { type: string }
 */

export default router;
