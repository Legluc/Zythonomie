import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/authenticate';
import {
  registerHandler,
  loginHandler,
  refreshHandler,
  getMeHandler,
  logoutHandler,
} from '../controllers/auth.controller';

const router = Router();

const registerSchema = z.object({
  name: z.string().min(1).max(50),
  firstname: z.string().min(1).max(50),
  mail: z.string().email(),
  password: z.string().min(8),
  birthday: z.string().date(),
  adress: z.string().min(1).max(255),
  icon: z.string().max(255).optional(),
});

const loginSchema = z.object({
  mail: z.string().email(),
  password: z.string().min(1),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

router.post('/register', validate(registerSchema, 'body'), registerHandler);
router.post('/login', validate(loginSchema, 'body'), loginHandler);
router.post('/refresh', validate(refreshSchema, 'body'), refreshHandler);
router.get('/me', authenticate, getMeHandler);
router.post('/logout', authenticate, validate(refreshSchema, 'body'), logoutHandler);

export default router;
