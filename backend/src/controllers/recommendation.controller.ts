import { Request, Response } from 'express';
import { sendSuccess } from '../lib/response';
import { getRecommendationsForUser, refreshRecommendationsForUser } from '../services/recommendation.service';

export async function getRecommendations(req: Request, res: Response): Promise<void> {
  const userId = Number(req.params.userId);
  const page = req.query.page ? Number(req.query.page) : 1;
  const limit = req.query.limit ? Number(req.query.limit) : 20;
  const result = await getRecommendationsForUser(userId, page, limit);
  sendSuccess(res, 200, result);
}

export async function postRefreshRecommendations(req: Request, res: Response): Promise<void> {
  const userId = Number(req.params.userId);
  const page = req.query.page ? Number(req.query.page) : 1;
  const limit = req.query.limit ? Number(req.query.limit) : 20;
  const result = await refreshRecommendationsForUser(userId, page, limit);
  sendSuccess(res, 200, result);
}
