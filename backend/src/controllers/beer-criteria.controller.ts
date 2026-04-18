import { Request, Response } from 'express';
import { sendSuccess } from '../lib/response';
import {
  deleteBeerCriteria,
  findBeerCriteriaEntry,
  findCriteriaByBeer,
  upsertBeerCriteria,
} from '../services/beer-criteria.service';

export async function getBeerCriteria(req: Request, res: Response): Promise<void> {
  const id_beer = Number(req.params.id_beer);
  const entries = await findCriteriaByBeer(id_beer);
  sendSuccess(res, 200, entries);
}

export async function getBeerCriteriaEntry(req: Request, res: Response): Promise<void> {
  const id_beer = Number(req.params.id_beer);
  const id_criterion = Number(req.params.id_criterion);
  const entry = await findBeerCriteriaEntry(id_criterion, id_beer);
  sendSuccess(res, 200, entry);
}

export async function putBeerCriteria(req: Request, res: Response): Promise<void> {
  const id_beer = Number(req.params.id_beer);
  const id_criterion = Number(req.params.id_criterion);
  const entry = await upsertBeerCriteria({ id_criterion, id_beer, score: req.body.score });
  sendSuccess(res, 200, entry);
}

export async function deleteBeerCriteriaHandler(req: Request, res: Response): Promise<void> {
  const id_beer = Number(req.params.id_beer);
  const id_criterion = Number(req.params.id_criterion);
  await deleteBeerCriteria(id_criterion, id_beer);
  sendSuccess(res, 200, { id_beer, id_criterion, deleted: true });
}
