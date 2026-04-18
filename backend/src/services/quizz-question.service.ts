import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma';
import { HttpError } from '../lib/http-error';

const quizzQuestionSelect = {
  id: true,
  id_quizz: true,
  id_criterion: true,
  question: true,
  criterion: {
    select: { id: true, name: true },
  },
  choices: {
    select: { id: true, choice: true, note_value: true },
    orderBy: { id: 'asc' as const },
  },
} satisfies Prisma.QuizzQuestionSelect;

export type QuizzQuestionPublic = Prisma.QuizzQuestionGetPayload<{ select: typeof quizzQuestionSelect }>;

export interface CreateQuizzQuestionInput {
  id_quizz: number;
  id_criterion: number;
  question: string;
}

export interface UpdateQuizzQuestionInput {
  id_criterion?: number;
  question?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function ensureQuizzExists(id_quizz: number): Promise<void> {
  const quizz = await prisma.quizz.findUnique({ where: { id: id_quizz }, select: { id: true } });
  if (!quizz) {
    throw new HttpError(404, 'QUIZ_NOT_FOUND', 'Quiz introuvable');
  }
}

async function ensureCriterionExists(id_criterion: number): Promise<void> {
  const criterion = await prisma.criterion.findUnique({ where: { id: id_criterion }, select: { id: true } });
  if (!criterion) {
    throw new HttpError(404, 'CRITERION_NOT_FOUND', 'Critère introuvable');
  }
}

// ─── Queries ─────────────────────────────────────────────────────────────────

export async function findQuestionsByQuizz(id_quizz: number): Promise<QuizzQuestionPublic[]> {
  await ensureQuizzExists(id_quizz);
  return prisma.quizzQuestion.findMany({
    where: { id_quizz },
    select: quizzQuestionSelect,
    orderBy: { id: 'asc' },
  });
}

export async function findQuizzQuestionById(id: number): Promise<QuizzQuestionPublic> {
  const question = await prisma.quizzQuestion.findUnique({
    where: { id },
    select: quizzQuestionSelect,
  });

  if (!question) {
    throw new HttpError(404, 'QUESTION_NOT_FOUND', 'Question introuvable');
  }

  return question;
}

// ─── Mutations ───────────────────────────────────────────────────────────────

export async function createQuizzQuestion(input: CreateQuizzQuestionInput): Promise<QuizzQuestionPublic> {
  await ensureQuizzExists(input.id_quizz);
  await ensureCriterionExists(input.id_criterion);

  return prisma.quizzQuestion.create({
    data: {
      id_quizz: input.id_quizz,
      id_criterion: input.id_criterion,
      question: input.question,
    },
    select: quizzQuestionSelect,
  });
}

export async function updateQuizzQuestion(id: number, input: UpdateQuizzQuestionInput): Promise<QuizzQuestionPublic> {
  await findQuizzQuestionById(id);

  if (input.id_criterion !== undefined) {
    await ensureCriterionExists(input.id_criterion);
  }

  return prisma.quizzQuestion.update({
    where: { id },
    data: input,
    select: quizzQuestionSelect,
  });
}

export async function deleteQuizzQuestion(id: number): Promise<void> {
  await findQuizzQuestionById(id);

  // Bloquer la suppression si des sessions actives ont déjà répondu à cette question
  const answersCount = await prisma.answerUser.count({
    where: {
      questionChoice: {
        id_quizz_question: id,
      },
    },
  });

  if (answersCount > 0) {
    throw new HttpError(
      409,
      'QUESTION_HAS_ANSWERS',
      'Cette question a déjà été répondue par des utilisateurs et ne peut pas être supprimée',
    );
  }

  try {
    await prisma.quizzQuestion.delete({ where: { id } });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      (error.code === 'P2003' || error.code === 'P2014')
    ) {
      throw new HttpError(409, 'QUESTION_IN_USE', 'Cette question est référencée et ne peut pas être supprimée');
    }
    throw error;
  }
}
