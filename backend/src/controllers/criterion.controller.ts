import { Request, Response } from 'express';
import { sendSuccess } from '../lib/response';
import {
  createCriterion,
  deleteCriterion,
  findAllCriteria,
  findCriterionById,
  updateCriterion,
} from '../services/criterion.service';

export async function getCriteria(_req: Request, res: Response): Promise<void> {
  const criteria = await findAllCriteria();
  sendSuccess(res, 200, criteria);
}

export async function getCriterionById(req: Request, res: Response): Promise<void> {
  const id = Number(req.params.id);
  const criterion = await findCriterionById(id);
  sendSuccess(res, 200, criterion);
}

export async function postCriterion(req: Request, res: Response): Promise<void> {
  const criterion = await createCriterion(req.body);
  sendSuccess(res, 201, criterion);
}

export async function patchCriterion(req: Request, res: Response): Promise<void> {
  const id = Number(req.params.id);
  const criterion = await updateCriterion(id, req.body);
  sendSuccess(res, 200, criterion);
}

export async function deleteCriterionHandler(req: Request, res: Response): Promise<void> {
  const id = Number(req.params.id);
  await deleteCriterion(id);
  sendSuccess(res, 200, { id, deleted: true });
}
