import prisma from '../../src/lib/prisma';
import { Prisma, Role } from '@prisma/client';

let _counter = 0;
function uid(): number {
  return ++_counter;
}

// ─── User ───────────────────────────────────────────────────────────────────

export async function createTestUser(overrides: Record<string, any> = {}) {
  const id = uid();
  return prisma.user.create({
    data: {
      name: overrides.name ?? `TestUser${id}`,
      firstname: overrides.firstname ?? `First${id}`,
      mail: overrides.mail ?? `test-${id}-${Date.now()}@test.local`,
      password: overrides.password ?? 'testpassword',
      birthday: overrides.birthday ?? new Date('1990-01-01'),
      adress: overrides.adress ?? '123 Test Street',
      role: overrides.role ?? Role.USER,
    },
  });
}

// ─── Brewery ────────────────────────────────────────────────────────────────

export async function createTestBrewery(overrides: Record<string, any> = {}) {
  const id = uid();
  return prisma.brewery.create({
    data: {
      name: overrides.name ?? `TestBrewery${id}`,
      description: overrides.description ?? 'Test brewery description',
      image: overrides.image ?? 'https://test.com/brewery.jpg',
      origin_date: overrides.origin_date ?? new Date('2020-01-01'),
    },
  });
}

// ─── Category ───────────────────────────────────────────────────────────────

export async function createTestCategory(overrides: Record<string, any> = {}) {
  const id = uid();
  return prisma.category.create({
    data: {
      name: overrides.name ?? `TestCat${id}`,
      description: overrides.description ?? 'Test category description',
    },
  });
}

// ─── Beer ───────────────────────────────────────────────────────────────────

export async function createTestBeer(overrides: Record<string, any> = {}) {
  const id = uid();
  return prisma.beer.create({
    data: {
      name: overrides.name ?? `TestBeer${id}`,
      description: overrides.description ?? 'Test beer description',
      alcool: overrides.alcool ?? true,
      percentage_alcool: overrides.percentage_alcool ?? new Prisma.Decimal('5.00'),
      EAN: overrides.EAN ?? 9000000 + id,
      image: overrides.image ?? 'https://test.com/beer.jpg',
    },
  });
}

// ─── Criterion ──────────────────────────────────────────────────────────────

export async function createTestCriterion(overrides: Record<string, any> = {}) {
  const id = uid();
  return prisma.criterion.create({
    data: {
      name: overrides.name ?? `test_criterion_${id}`,
      description: overrides.description ?? 'Test criterion',
    },
  });
}

// ─── Quiz ───────────────────────────────────────────────────────────────────

export async function createTestQuiz(overrides: Record<string, any> = {}) {
  const id = uid();
  return prisma.quizz.create({
    data: {
      name: overrides.name ?? `TestQuiz${id}`,
      description: overrides.description ?? 'Test quiz',
    },
  });
}

export interface QuizWithQuestions {
  quiz: { id: number; name: string };
  questions: {
    id: number;
    criterionId: number;
    choices: { id: number; note_value: number }[];
  }[];
}

/**
 * Crée un quiz complet avec une question par critère,
 * chaque question ayant 5 choix (note_value 1 à 5).
 */
export async function createTestQuizWithQuestions(
  criterionIds: number[],
  quizOverrides: Record<string, any> = {},
): Promise<QuizWithQuestions> {
  const quiz = await createTestQuiz(quizOverrides);
  const questions: QuizWithQuestions['questions'] = [];

  for (const criterionId of criterionIds) {
    const question = await prisma.quizzQuestion.create({
      data: {
        id_quizz: quiz.id,
        id_criterion: criterionId,
        question: `Question for criterion ${criterionId}`,
      },
    });

    const choices: { id: number; note_value: number }[] = [];
    for (let note = 1; note <= 5; note++) {
      const choice = await prisma.questionChoice.create({
        data: {
          id_quizz_question: question.id,
          choice: `Choice ${note}`,
          note_value: note,
        },
      });
      choices.push({ id: choice.id, note_value: choice.note_value });
    }

    questions.push({ id: question.id, criterionId, choices });
  }

  return { quiz, questions };
}
