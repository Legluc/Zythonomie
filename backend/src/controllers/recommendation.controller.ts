import { Request, Response } from 'express';
import { sendSuccess } from '../lib/response';
import { getRecommendationsForUser, refreshRecommendationsForUser } from '../services/recommendation.service';

export async function getRecommendations(req: Request, res: Response): Promise<void> {
  const userId = Number(req.params.userId);
  const limit = req.query.limit ? Number(req.query.limit) : 10;
  const recommendations = await getRecommendationsForUser(userId, limit);
  sendSuccess(res, 200, recommendations);
}

export async function postRefreshRecommendations(req: Request, res: Response): Promise<void> {
  const userId = Number(req.params.userId);
  const limit = req.query.limit ? Number(req.query.limit) : 10;
  const recommendations = await refreshRecommendationsForUser(userId, limit);
  sendSuccess(res, 200, recommendations);
}
