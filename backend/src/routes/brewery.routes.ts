import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/authenticate';
import { requireAdmin } from '../middleware/require-admin';
import {
  deleteBreweryHandler,
  getBreweries,
  getBreweryById,
  postBrewery,
  putBrewery,
} from '../controllers/brewery.controller';

const router = Router();

const idParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const breweryCreateSchema = z.object({
  name: z.string().trim().min(1).max(50),
  description: z.string().trim().min(1),
  image: z.string().trim().min(1).max(255),
  origin_date: z.coerce.date(),
});

const breweryUpdateSchema = z
  .object({
    name: z.string().trim().min(1).max(50).optional(),
    description: z.string().trim().min(1).optional(),
    image: z.string().trim().min(1).max(255).optional(),
    origin_date: z.coerce.date().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Au moins un champ est requis pour la mise a jour',
  });

router.get('/', authenticate, validate(paginationSchema, 'query'), getBreweries);
router.get('/:id', authenticate, validate(idParamsSchema, 'params'), getBreweryById);
router.post('/', authenticate, requireAdmin, validate(breweryCreateSchema), postBrewery);
router.put('/:id', authenticate, requireAdmin, validate(idParamsSchema, 'params'), validate(breweryUpdateSchema), putBrewery);
router.delete('/:id', authenticate, requireAdmin, validate(idParamsSchema, 'params'), deleteBreweryHandler);

export default router;
