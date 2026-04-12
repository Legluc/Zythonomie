import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { deleteBeer, getBeerById, getBeers, postBeer, putBeer } from '../controllers/beer.controller';

const router = Router();

// ─── Schémas de validation ────────────────────────────────────────────────────

const idParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

const beerFiltersSchema = z.object({
  alcool: z.enum(['true', 'false']).optional(),
  breweryId: z.coerce.number().int().positive().optional(),
  categoryId: z.coerce.number().int().positive().optional(),
});

const beerCreateSchema = z.object({
  name: z.string().trim().min(1).max(50),
  description: z.string().trim().min(1),
  alcool: z.boolean(),
  percentage_alcool: z.number().min(0).max(100),
  EAN: z.number().int().positive(),
  image: z.string().trim().min(1).max(255),
  brewery_ids: z.array(z.number().int().positive()).optional(),
  category_ids: z.array(z.number().int().positive()).optional(),
});

const beerUpdateSchema = z
  .object({
    name: z.string().trim().min(1).max(50).optional(),
    description: z.string().trim().min(1).optional(),
    alcool: z.boolean().optional(),
    percentage_alcool: z.number().min(0).max(100).optional(),
    EAN: z.number().int().positive().optional(),
    image: z.string().trim().min(1).max(255).optional(),
    brewery_ids: z.array(z.number().int().positive()).optional(),
    category_ids: z.array(z.number().int().positive()).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Au moins un champ est requis pour la mise à jour',
  });

// ─── Routes ───────────────────────────────────────────────────────────────────

router.get('/', validate(beerFiltersSchema, 'query'), getBeers);
router.get('/:id', validate(idParamsSchema, 'params'), getBeerById);
router.post('/', validate(beerCreateSchema), postBeer);
router.put('/:id', validate(idParamsSchema, 'params'), validate(beerUpdateSchema), putBeer);
router.delete('/:id', validate(idParamsSchema, 'params'), deleteBeer);

export default router;
