import { Request, Response } from 'express';
import { sendSuccess } from '../lib/response';
import { createUser, findAllUsers, findUserById, softDeleteUser, updateUser } from '../services/user.service';

export async function getUsers(req: Request, res: Response): Promise<void> {
  const page = req.query.page ? Number(req.query.page) : 1;
  const limit = req.query.limit ? Number(req.query.limit) : 20;
  const result = await findAllUsers(page, limit);
  sendSuccess(res, 200, result);
}

export async function getUserById(req: Request, res: Response): Promise<void> {
  const userId = Number(req.params.id);
  const user = await findUserById(userId);
  sendSuccess(res, 200, user);
}

export async function postUser(req: Request, res: Response): Promise<void> {
  const user = await createUser(req.body);
  sendSuccess(res, 201, user);
}

export async function putUser(req: Request, res: Response): Promise<void> {
  const userId = Number(req.params.id);
  const user = await updateUser(userId, req.body);
  sendSuccess(res, 200, user);
}

export async function deleteUser(req: Request, res: Response): Promise<void> {
  const userId = Number(req.params.id);
  await softDeleteUser(userId);
  sendSuccess(res, 200, {
    id: userId,
    deleted: true,
  });
}
