import { Request, Response } from 'express';
import { sendSuccess } from '../lib/response';
import {
  BeerFilters,
  createBeer,
  findAllBeers,
  findBeerById,
  softDeleteBeer,
  updateBeer,
} from '../services/beer.service';

export async function getBeers(req: Request, res: Response): Promise<void> {
  const filters: BeerFilters = {};

  if (req.query.alcool !== undefined) {
    filters.alcool = req.query.alcool === 'true';
  }
  if (req.query.breweryId !== undefined) {
    filters.breweryId = Number(req.query.breweryId);
  }
  if (req.query.categoryId !== undefined) {
    filters.categoryId = Number(req.query.categoryId);
  }

  const beers = await findAllBeers(filters);
  sendSuccess(res, 200, beers);
}

export async function getBeerById(req: Request, res: Response): Promise<void> {
  const beerId = Number(req.params.id);
  const beer = await findBeerById(beerId);
  sendSuccess(res, 200, beer);
}

export async function postBeer(req: Request, res: Response): Promise<void> {
  const beer = await createBeer(req.body);
  sendSuccess(res, 201, beer);
}

export async function putBeer(req: Request, res: Response): Promise<void> {
  const beerId = Number(req.params.id);
  const beer = await updateBeer(beerId, req.body);
  sendSuccess(res, 200, beer);
}

export async function deleteBeer(req: Request, res: Response): Promise<void> {
  const beerId = Number(req.params.id);
  await softDeleteBeer(beerId);
  sendSuccess(res, 200, { id: beerId, deleted: true });
}
