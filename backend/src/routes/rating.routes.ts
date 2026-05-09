import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/authenticate';
import {
  deleteRating,
  getRatingsByBeer,
  getRatingsByUser,
  postRating,
  putRating,
} from '../controllers/rating.controller';

const router = Router();

const idSchema = z.object({
  id: z.coerce.number().int().positive(),
});

const beerIdSchema = z.object({
  beerId: z.coerce.number().int().positive(),
});

const userIdSchema = z.object({
  userId: z.coerce.number().int().positive(),
});

const createRatingSchema = z.object({
  id_user: z.number().int().positive(),
  id_beer: z.number().int().positive(),
  content: z.string().trim().min(1),
  rate: z.number().int().min(1).max(5),
});

const updateRatingSchema = z
  .object({
    content: z.string().trim().min(1).optional(),
    rate: z.number().int().min(1).max(5).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Au moins un champ est requis pour la mise a jour',
  });

router.get('/beer/:beerId', authenticate, validate(beerIdSchema, 'params'), getRatingsByBeer);
router.get('/user/:userId', authenticate, validate(userIdSchema, 'params'), getRatingsByUser);
router.post('/', authenticate, validate(createRatingSchema), postRating);
// Propriétaire ou admin : la vérification se fait dans le service via req.user
router.put('/:id', authenticate, validate(idSchema, 'params'), validate(updateRatingSchema), putRating);
router.delete('/:id', authenticate, validate(idSchema, 'params'), deleteRating);

export default router;
