import { Request, Response } from 'express';
import { sendSuccess } from '../lib/response';
import {
  answerQuestion,
  completeSession,
  findAllSessions,
  getSessionProgress,
  startSession,
} from '../services/quizz-session.service';

export async function getSessions(req: Request, res: Response): Promise<void> {
  const page = req.query.page ? Number(req.query.page) : 1;
  const limit = req.query.limit ? Number(req.query.limit) : 20;
  const result = await findAllSessions(page, limit);
  sendSuccess(res, 200, result);
}

export async function postStartSession(req: Request, res: Response): Promise<void> {
  const { id_user, id_quizz } = req.body;
  const result = await startSession(id_user, id_quizz);
  sendSuccess(res, 201, result);
}

export async function getSessionById(req: Request, res: Response): Promise<void> {
  const sessionId = Number(req.params.id);
  const result = await getSessionProgress(sessionId);
  sendSuccess(res, 200, result);
}

export async function postSessionAnswer(req: Request, res: Response): Promise<void> {
  const sessionId = Number(req.params.id);
  const { id_question_choice } = req.body;
  const result = await answerQuestion(sessionId, id_question_choice);
  sendSuccess(res, 200, result);
}

export async function putCompleteSession(req: Request, res: Response): Promise<void> {
  const sessionId = Number(req.params.id);
  const result = await completeSession(sessionId);
  sendSuccess(res, 200, result);
}
