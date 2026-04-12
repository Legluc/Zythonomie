import { Request, Response } from 'express';
import { sendSuccess } from '../lib/response';
import { createQuiz, findAllQuizzes, findQuizById } from '../services/quiz.service';

export async function getQuizzes(_req: Request, res: Response): Promise<void> {
  const quizzes = await findAllQuizzes();
  sendSuccess(res, 200, quizzes);
}

export async function getQuizById(req: Request, res: Response): Promise<void> {
  const quizId = Number(req.params.id);
  const quiz = await findQuizById(quizId);
  sendSuccess(res, 200, quiz);
}

export async function postQuiz(req: Request, res: Response): Promise<void> {
  const quiz = await createQuiz(req.body);
  sendSuccess(res, 201, quiz);
}
