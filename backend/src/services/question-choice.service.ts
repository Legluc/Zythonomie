import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma';
import { HttpError } from '../lib/http-error';
import { paginate, PaginatedResult } from '../lib/paginate';

const questionChoiceSelect = {
  id: true,
  id_quizz_question: true,
  choice: true,
  note_value: true,
} satisfies Prisma.QuestionChoiceSelect;

export type QuestionChoicePublic = Prisma.QuestionChoiceGetPayload<{ select: typeof questionChoiceSelect }>;

export interface CreateQuestionChoiceInput {
  id_quizz_question: number;
  choice: string;
  note_value: number;
}

export interface UpdateQuestionChoiceInput {
  choice?: string;
  note_value?: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function ensureQuestionExists(id_quizz_question: number): Promise<void> {
  const question = await prisma.quizzQuestion.findUnique({
    where: { id: id_quizz_question },
    select: { id: true },
  });
  if (!question) {
    throw new HttpError(404, 'QUESTION_NOT_FOUND', 'Question introuvable');
  }
}

// ─── Queries ─────────────────────────────────────────────────────────────────

export async function findChoicesByQuestion(id_quizz_question: number, page = 1, limit = 20): Promise<PaginatedResult<QuestionChoicePublic>> {
  await ensureQuestionExists(id_quizz_question);
  return paginate<QuestionChoicePublic>(
    prisma.questionChoice as any,
    { where: { id_quizz_question }, select: questionChoiceSelect, orderBy: { id: 'asc' } },
    page,
    limit,
  );
}

export async function findQuestionChoiceById(id: number): Promise<QuestionChoicePublic> {
  const choice = await prisma.questionChoice.findUnique({
    where: { id },
    select: questionChoiceSelect,
  });

  if (!choice) {
    throw new HttpError(404, 'CHOICE_NOT_FOUND', 'Choix introuvable');
  }

  return choice;
}

// ─── Mutations ───────────────────────────────────────────────────────────────

export async function createQuestionChoice(input: CreateQuestionChoiceInput): Promise<QuestionChoicePublic> {
  await ensureQuestionExists(input.id_quizz_question);

  return prisma.questionChoice.create({
    data: {
      id_quizz_question: input.id_quizz_question,
      choice: input.choice,
      note_value: input.note_value,
    },
    select: questionChoiceSelect,
  });
}

export async function updateQuestionChoice(id: number, input: UpdateQuestionChoiceInput): Promise<QuestionChoicePublic> {
  await findQuestionChoiceById(id);

  return prisma.questionChoice.update({
    where: { id },
    data: input,
    select: questionChoiceSelect,
  });
}

export async function deleteQuestionChoice(id: number): Promise<void> {
  await findQuestionChoiceById(id);

  const answersCount = await prisma.answerUser.count({
    where: { id_question_choice: id },
  });

  if (answersCount > 0) {
    throw new HttpError(
      409,
      'CHOICE_HAS_ANSWERS',
      'Ce choix a déjà été sélectionné par des utilisateurs et ne peut pas être supprimé',
    );
  }

  await prisma.questionChoice.delete({ where: { id } });
}
