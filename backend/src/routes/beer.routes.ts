import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/authenticate';
import { requireAdmin } from '../middleware/require-admin';
import { deleteBeer, getBeerById, getBeers, postBeer, putBeer,
  postBeerBrewery, deleteBeerBrewery, postBeerCategory, deleteBeerCategory,
} from '../controllers/beer.controller';

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

router.get('/', validate(beerFiltersSchema, 'query'), authenticate, getBeers);
router.get('/:id', validate(idParamsSchema, 'params'), authenticate, getBeerById);
router.post('/', authenticate, requireAdmin, validate(beerCreateSchema), postBeer);
router.put('/:id', authenticate, requireAdmin, validate(idParamsSchema, 'params'), validate(beerUpdateSchema), putBeer);
router.delete('/:id', authenticate, requireAdmin, validate(idParamsSchema, 'params'), deleteBeer);

// ─── Liaisons atomiques ───────────────────────────────────────────────────────

const breweryLinkSchema = z.object({ id_brewery: z.number().int().positive() });
const categoryLinkSchema = z.object({ id_category: z.number().int().positive() });
const breweryParamSchema = z.object({ id: z.coerce.number().int().positive(), id_brewery: z.coerce.number().int().positive() });
const categoryParamSchema = z.object({ id: z.coerce.number().int().positive(), id_category: z.coerce.number().int().positive() });

router.post('/:id/breweries', authenticate, requireAdmin, validate(idParamsSchema, 'params'), validate(breweryLinkSchema), postBeerBrewery);
router.delete('/:id/breweries/:id_brewery', authenticate, requireAdmin, validate(breweryParamSchema, 'params'), deleteBeerBrewery);
router.post('/:id/categories', authenticate, requireAdmin, validate(idParamsSchema, 'params'), validate(categoryLinkSchema), postBeerCategory);
router.delete('/:id/categories/:id_category', authenticate, requireAdmin, validate(categoryParamSchema, 'params'), deleteBeerCategory);

export default router;
