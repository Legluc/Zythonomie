import { Request, Response } from 'express';
import { sendSuccess } from '../lib/response';
import {
  deleteUserCriteria,
  findCriteriaByUser,
  findUserCriteriaEntry,
  upsertUserCriteria,
} from '../services/user-criteria.service';

export async function getUserCriteria(req: Request, res: Response): Promise<void> {
  const id_user = Number(req.params.id_user);
  const entries = await findCriteriaByUser(id_user);
  sendSuccess(res, 200, entries);
}

export async function getUserCriteriaEntry(req: Request, res: Response): Promise<void> {
  const id_user = Number(req.params.id_user);
  const id_criterion = Number(req.params.id_criterion);
  const entry = await findUserCriteriaEntry(id_user, id_criterion);
  sendSuccess(res, 200, entry);
}

export async function putUserCriteria(req: Request, res: Response): Promise<void> {
  const id_user = Number(req.params.id_user);
  const id_criterion = Number(req.params.id_criterion);
  const entry = await upsertUserCriteria({ id_user, id_criterion, score: req.body.score });
  sendSuccess(res, 200, entry);
}

export async function deleteUserCriteriaHandler(req: Request, res: Response): Promise<void> {
  const id_user = Number(req.params.id_user);
  const id_criterion = Number(req.params.id_criterion);
  await deleteUserCriteria(id_user, id_criterion);
  sendSuccess(res, 200, { id_user, id_criterion, deleted: true });
}
