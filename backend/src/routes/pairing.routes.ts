import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import {
  deletePairingHandler,
  getPairingById,
  getPairings,
  postPairing,
  putPairing,
} from '../controllers/pairing.controller';

const router = Router();

const idParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
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

router.get('/', getPairings);
router.get('/:id', validate(idParamsSchema, 'params'), getPairingById);
router.post('/', validate(pairingCreateSchema), postPairing);
router.put('/:id', validate(idParamsSchema, 'params'), validate(pairingUpdateSchema), putPairing);
router.delete('/:id', validate(idParamsSchema, 'params'), deletePairingHandler);

export default router;
