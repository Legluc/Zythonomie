import { Request, Response } from 'express';
import { sendSuccess } from '../lib/response';
import {
  createBrewery,
  deleteBrewery,
  findAllBreweries,
  findBreweryById,
  updateBrewery,
} from '../services/brewery.service';

export async function getBreweries(_req: Request, res: Response): Promise<void> {
  const breweries = await findAllBreweries();
  sendSuccess(res, 200, breweries);
}

export async function getBreweryById(req: Request, res: Response): Promise<void> {
  const breweryId = Number(req.params.id);
  const brewery = await findBreweryById(breweryId);
  sendSuccess(res, 200, brewery);
}

export async function postBrewery(req: Request, res: Response): Promise<void> {
  const brewery = await createBrewery(req.body);
  sendSuccess(res, 201, brewery);
}

export async function putBrewery(req: Request, res: Response): Promise<void> {
  const breweryId = Number(req.params.id);
  const brewery = await updateBrewery(breweryId, req.body);
  sendSuccess(res, 200, brewery);
}

export async function deleteBreweryHandler(req: Request, res: Response): Promise<void> {
  const breweryId = Number(req.params.id);
  await deleteBrewery(breweryId);
  sendSuccess(res, 200, { id: breweryId, deleted: true });
}
