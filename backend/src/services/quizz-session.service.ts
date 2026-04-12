import { Prisma, QuizzSessionStatus } from '@prisma/client';
import prisma from '../lib/prisma';
import { HttpError } from '../lib/http-error';

const sessionSelect = {
  id: true,
  id_user: true,
  id_quizz: true,
  status: true,
  started_at: true,
  completed_at: true,
} satisfies Prisma.QuizzSessionSelect;

export type QuizzSessionPublic = Prisma.QuizzSessionGetPayload<{ select: typeof sessionSelect }>;

export interface SessionProgress {
  session: QuizzSessionPublic;
  answered_count: number;
  total_questions: number;
}

export async function startSession(id_user: number, id_quizz: number): Promise<SessionProgress> {
  await ensureActiveUser(id_user);
  await ensureQuizExists(id_quizz);

  const session = await prisma.quizzSession.create({
    data: {
      id_user,
      id_quizz,
      status: QuizzSessionStatus.IN_PROGRESS,
    },
    select: sessionSelect,
  });

  return getSessionProgress(session.id);
}

export async function answerQuestion(id_session: number, id_question_choice: number): Promise<SessionProgress> {
  const session = await ensureSessionInProgress(id_session);

  const choice = await prisma.questionChoice.findUnique({
    where: { id: id_question_choice },
    select: {
      id: true,
      id_quizz_question: true,
      quizzQuestion: {
        select: {
          id_quizz: true,
        },
      },
    },
  });

  if (!choice) {
    throw new HttpError(404, 'QUESTION_CHOICE_NOT_FOUND', 'Choix de question introuvable');
  }

  if (choice.quizzQuestion.id_quizz !== session.id_quizz) {
    throw new HttpError(400, 'QUESTION_NOT_IN_QUIZ', 'Le choix ne correspond pas au quiz de la session');
  }

  const existingAnswer = await prisma.answerUser.findFirst({
    where: {
      id_quizz_session: id_session,
      questionChoice: {
        id_quizz_question: choice.id_quizz_question,
      },
    },
    select: { id: true },
  });

  if (existingAnswer) {
    throw new HttpError(409, 'QUESTION_ALREADY_ANSWERED', 'La question est deja repondue pour cette session');
  }

  await prisma.answerUser.create({
    data: {
      id_quizz_session: id_session,
      id_question_choice: id_question_choice,
    },
  });

  return getSessionProgress(id_session);
}

export async function completeSession(id_session: number): Promise<SessionProgress> {
  const session = await ensureSessionInProgress(id_session);

  await prisma.quizzSession.update({
    where: { id: id_session },
    data: {
      status: QuizzSessionStatus.COMPLETED,
      completed_at: new Date(),
    },
  });

  await upsertUserCriteriaFromSession(session.id_user, id_session);

  return getSessionProgress(id_session);
}

export async function getSessionProgress(id_session: number): Promise<SessionProgress> {
  const session = await prisma.quizzSession.findUnique({
    where: { id: id_session },
    select: sessionSelect,
  });

  if (!session) {
    throw new HttpError(404, 'QUIZZ_SESSION_NOT_FOUND', 'Session de quiz introuvable');
  }

  const [answeredCount, totalQuestions] = await Promise.all([
    prisma.answerUser.count({
      where: { id_quizz_session: id_session },
    }),
    prisma.quizzQuestion.count({
      where: { id_quizz: session.id_quizz },
    }),
  ]);

  return {
    session,
    answered_count: answeredCount,
    total_questions: totalQuestions,
  };
}

async function ensureActiveUser(id: number): Promise<void> {
  const user = await prisma.user.findFirst({
    where: { id, deleted_at: null },
    select: { id: true },
  });

  if (!user) {
    throw new HttpError(404, 'USER_NOT_FOUND', 'Utilisateur introuvable');
  }
}

async function ensureQuizExists(id: number): Promise<void> {
  const quiz = await prisma.quizz.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!quiz) {
    throw new HttpError(404, 'QUIZ_NOT_FOUND', 'Quiz introuvable');
  }
}

async function ensureSessionInProgress(id: number): Promise<QuizzSessionPublic> {
  const session = await prisma.quizzSession.findUnique({
    where: { id },
    select: sessionSelect,
  });

  if (!session) {
    throw new HttpError(404, 'QUIZZ_SESSION_NOT_FOUND', 'Session de quiz introuvable');
  }

  if (session.status !== QuizzSessionStatus.IN_PROGRESS) {
    throw new HttpError(409, 'QUIZZ_SESSION_NOT_IN_PROGRESS', 'La session doit etre en cours pour cette operation');
  }

  return session;
}

async function upsertUserCriteriaFromSession(id_user: number, id_session: number): Promise<void> {
  const answers = await prisma.answerUser.findMany({
    where: { id_quizz_session: id_session },
    select: {
      questionChoice: {
        select: {
          note_value: true,
          quizzQuestion: {
            select: {
              id_criterion: true,
            },
          },
        },
      },
    },
  });

  if (answers.length === 0) {
    return;
  }

  const scoresByCriterion = new Map<number, { total: number; count: number }>();

  for (const answer of answers) {
    const criterionId = answer.questionChoice.quizzQuestion.id_criterion;
    const current = scoresByCriterion.get(criterionId) ?? { total: 0, count: 0 };
    current.total += answer.questionChoice.note_value;
    current.count += 1;
    scoresByCriterion.set(criterionId, current);
  }

  const operations: Prisma.PrismaPromise<unknown>[] = [];

  for (const [criterionId, aggregate] of scoresByCriterion.entries()) {
    const avg = aggregate.total / aggregate.count;
    operations.push(
      prisma.userCriteria.upsert({
        where: {
          id_user_id_criterion: {
            id_user,
            id_criterion: criterionId,
          },
        },
        update: {
          score: new Prisma.Decimal(avg.toFixed(2)),
        },
        create: {
          id_user,
          id_criterion: criterionId,
          score: new Prisma.Decimal(avg.toFixed(2)),
        },
      }),
    );
  }

  await prisma.$transaction(operations);
}
