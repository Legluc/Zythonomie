import { Router } from 'express';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
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

const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: 'TOO_MANY_REQUESTS', message: 'Trop de tentatives de connexion. Réessayez dans 1 minute.' },
  },
  skip: () => process.env.NODE_ENV === 'test',
});

router.post('/register', validate(registerSchema, 'body'), registerHandler);
router.post('/login', loginLimiter, validate(loginSchema, 'body'), loginHandler);
router.post('/refresh', validate(refreshSchema, 'body'), refreshHandler);
router.get('/me', authenticate, getMeHandler);
router.post('/logout', authenticate, validate(refreshSchema, 'body'), logoutHandler);

export default router;
