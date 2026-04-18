import { Request, Response } from 'express';
import { sendSuccess } from '../lib/response';
import {
  createQuizzQuestion,
  deleteQuizzQuestion,
  findQuestionsByQuizz,
  findQuizzQuestionById,
  updateQuizzQuestion,
} from '../services/quizz-question.service';

export async function getQuestionsByQuizz(req: Request, res: Response): Promise<void> {
  const id_quizz = Number(req.params.id_quizz);
  const questions = await findQuestionsByQuizz(id_quizz);
  sendSuccess(res, 200, questions);
}

export async function getQuizzQuestionById(req: Request, res: Response): Promise<void> {
  const id = Number(req.params.id);
  const question = await findQuizzQuestionById(id);
  sendSuccess(res, 200, question);
}

export async function postQuizzQuestion(req: Request, res: Response): Promise<void> {
  const question = await createQuizzQuestion(req.body);
  sendSuccess(res, 201, question);
}

export async function patchQuizzQuestion(req: Request, res: Response): Promise<void> {
  const id = Number(req.params.id);
  const question = await updateQuizzQuestion(id, req.body);
  sendSuccess(res, 200, question);
}

export async function deleteQuizzQuestionHandler(req: Request, res: Response): Promise<void> {
  const id = Number(req.params.id);
  await deleteQuizzQuestion(id);
  sendSuccess(res, 200, { id, deleted: true });
}
