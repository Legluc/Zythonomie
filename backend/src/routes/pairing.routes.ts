import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/authenticate';
import { requireAdmin } from '../middleware/require-admin';
import {
  deletePairingHandler,
  getPairingById,
  getPairings,
  postPairing,
  putPairing,
  postPairingCategory,
  deletePairingCategory,
} from '../controllers/pairing.controller';

const router = Router();

const idParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const pairingCreateSchema = z.object({
  name: z.string().trim().min(1).max(50),
  description: z.string().trim().min(1),
  category_ids: z.array(z.number().int().positive()).optional(),
});

const pairingUpdateSchema = z
  .object({
    name: z.string().trim().min(1).max(50).optional(),
    description: z.string().trim().min(1).optional(),
    category_ids: z.array(z.number().int().positive()).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Au moins un champ est requis pour la mise a jour',
  });

router.get('/', authenticate, validate(paginationSchema, 'query'), getPairings);
router.get('/:id', authenticate, validate(idParamsSchema, 'params'), getPairingById);
router.post('/', authenticate, requireAdmin, validate(pairingCreateSchema), postPairing);
router.put('/:id', authenticate, requireAdmin, validate(idParamsSchema, 'params'), validate(pairingUpdateSchema), putPairing);
router.delete('/:id', authenticate, requireAdmin, validate(idParamsSchema, 'params'), deletePairingHandler);

// ─── Liaisons atomiques ───────────────────────────────────────────────────────

const categoryLinkSchema = z.object({ id_category: z.number().int().positive() });
const categoryParamSchema = z.object({
  id: z.coerce.number().int().positive(),
  id_category: z.coerce.number().int().positive(),
});

router.post('/:id/categories', authenticate, requireAdmin, validate(idParamsSchema, 'params'), validate(categoryLinkSchema), postPairingCategory);
router.delete('/:id/categories/:id_category', authenticate, requireAdmin, validate(categoryParamSchema, 'params'), deletePairingCategory);

export default router;
