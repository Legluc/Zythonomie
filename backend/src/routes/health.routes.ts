import { Router } from 'express';
import { sendSuccess } from '../lib/response';

const router = Router();

router.get('/', (_req, res) => {
  sendSuccess(res, 200, {
    status: 'ok',
    message: 'Zythonomie API is running',
  });
});

export default router;
