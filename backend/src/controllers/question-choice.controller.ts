import { Request, Response } from 'express';
import { sendSuccess } from '../lib/response';
import {
  createQuestionChoice,
  deleteQuestionChoice,
  findChoicesByQuestion,
  findQuestionChoiceById,
  updateQuestionChoice,
} from '../services/question-choice.service';

export async function getChoicesByQuestion(req: Request, res: Response): Promise<void> {
  const id_quizz_question = Number(req.params.id_quizz_question);
  const choices = await findChoicesByQuestion(id_quizz_question);
  sendSuccess(res, 200, choices);
}

export async function getQuestionChoiceById(req: Request, res: Response): Promise<void> {
  const id = Number(req.params.id);
  const choice = await findQuestionChoiceById(id);
  sendSuccess(res, 200, choice);
}

export async function postQuestionChoice(req: Request, res: Response): Promise<void> {
  const choice = await createQuestionChoice(req.body);
  sendSuccess(res, 201, choice);
}

export async function patchQuestionChoice(req: Request, res: Response): Promise<void> {
  const id = Number(req.params.id);
  const choice = await updateQuestionChoice(id, req.body);
  sendSuccess(res, 200, choice);
}

export async function deleteQuestionChoiceHandler(req: Request, res: Response): Promise<void> {
  const id = Number(req.params.id);
  await deleteQuestionChoice(id);
  sendSuccess(res, 200, { id, deleted: true });
}
