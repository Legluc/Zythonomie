import { Request, Response } from 'express';
import { sendSuccess } from '../lib/response';
import {
  createRating,
  findRatingsByBeer,
  findRatingsByUser,
  softDeleteRating,
  updateRating,
} from '../services/rating.service';

export async function getRatingsByBeer(req: Request, res: Response): Promise<void> {
  const beerId = Number(req.params.beerId);
  const page = req.query.page ? Number(req.query.page) : 1;
  const limit = req.query.limit ? Number(req.query.limit) : 20;
  const result = await findRatingsByBeer(beerId, page, limit);
  sendSuccess(res, 200, result);
}

export async function getRatingsByUser(req: Request, res: Response): Promise<void> {
  const userId = Number(req.params.userId);
  const page = req.query.page ? Number(req.query.page) : 1;
  const limit = req.query.limit ? Number(req.query.limit) : 20;
  const result = await findRatingsByUser(userId, page, limit);
  sendSuccess(res, 200, result);
}

export async function postRating(req: Request, res: Response): Promise<void> {
  const rating = await createRating(req.body);
  sendSuccess(res, 201, rating);
}

export async function putRating(req: Request, res: Response): Promise<void> {
  const ratingId = Number(req.params.id);
  const rating = await updateRating(ratingId, req.body, req.user);
  sendSuccess(res, 200, rating);
}

export async function deleteRating(req: Request, res: Response): Promise<void> {
  const ratingId = Number(req.params.id);
  await softDeleteRating(ratingId, req.user);
  sendSuccess(res, 200, { id: ratingId, deleted: true });
}
