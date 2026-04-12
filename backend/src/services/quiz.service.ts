import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma';
import { HttpError } from '../lib/http-error';

const quizDetailSelect = {
  id: true,
  name: true,
  description: true,
  created_at: true,
  questions: {
    select: {
      id: true,
      question: true,
      id_criterion: true,
      criterion: {
        select: {
          id: true,
          name: true,
          description: true,
        },
      },
      choices: {
        select: {
          id: true,
          choice: true,
          note_value: true,
        },
        orderBy: { id: 'asc' },
      },
    },
    orderBy: { id: 'asc' },
  },
} satisfies Prisma.QuizzSelect;

export type QuizDetail = Prisma.QuizzGetPayload<{ select: typeof quizDetailSelect }>;

export interface CreateQuizInput {
  name: string;
  description: string;
  questions: Array<{
    id_criterion: number;
    question: string;
    choices: Array<{
      choice: string;
      note_value: number;
    }>;
  }>;
}

export async function findAllQuizzes(): Promise<Array<{ id: number; name: string; description: string; created_at: Date; question_count: number }>> {
  const quizzes = await prisma.quizz.findMany({
    select: {
      id: true,
      name: true,
      description: true,
      created_at: true,
      _count: {
        select: {
          questions: true,
        },
      },
    },
    orderBy: { id: 'asc' },
  });

  return quizzes.map((quiz) => ({
    id: quiz.id,
    name: quiz.name,
    description: quiz.description,
    created_at: quiz.created_at,
    question_count: quiz._count.questions,
  }));
}

export async function findQuizById(id: number): Promise<QuizDetail> {
  const quiz = await prisma.quizz.findUnique({
    where: { id },
    select: quizDetailSelect,
  });

  if (!quiz) {
    throw new HttpError(404, 'QUIZ_NOT_FOUND', 'Quiz introuvable');
  }

  return quiz;
}

export async function createQuiz(input: CreateQuizInput): Promise<QuizDetail> {
  const criterionIds = [...new Set(input.questions.map((q) => q.id_criterion))];

  const criteria = await prisma.criterion.findMany({
    where: { id: { in: criterionIds } },
    select: { id: true },
  });

  if (criteria.length !== criterionIds.length) {
    throw new HttpError(400, 'CRITERION_NOT_FOUND', 'Un ou plusieurs criteres sont introuvables');
  }

  const quiz = await prisma.quizz.create({
    data: {
      name: input.name,
      description: input.description,
      questions: {
        create: input.questions.map((q) => ({
          id_criterion: q.id_criterion,
          question: q.question,
          choices: {
            create: q.choices.map((c) => ({
              choice: c.choice,
              note_value: c.note_value,
            })),
          },
        })),
      },
    },
    select: { id: true },
  });

  return findQuizById(quiz.id);
}
