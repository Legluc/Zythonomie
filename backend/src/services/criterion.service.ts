import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma';
import { HttpError } from '../lib/http-error';

const criterionSelect = {
  id: true,
  name: true,
  description: true,
} satisfies Prisma.CriterionSelect;

export type CriterionPublic = Prisma.CriterionGetPayload<{ select: typeof criterionSelect }>;

export interface CreateCriterionInput {
  name: string;
  description: string;
}

export interface UpdateCriterionInput {
  name?: string;
  description?: string;
}

export async function findAllCriteria(): Promise<CriterionPublic[]> {
  return prisma.criterion.findMany({
    select: criterionSelect,
    orderBy: { name: 'asc' },
  });
}

export async function findCriterionById(id: number): Promise<CriterionPublic> {
  const criterion = await prisma.criterion.findUnique({
    where: { id },
    select: criterionSelect,
  });

  if (!criterion) {
    throw new HttpError(404, 'CRITERION_NOT_FOUND', 'Critère introuvable');
  }

  return criterion;
}

export async function createCriterion(input: CreateCriterionInput): Promise<CriterionPublic> {
  return prisma.criterion.create({
    data: {
      name: input.name,
      description: input.description,
    },
    select: criterionSelect,
  });
}

export async function updateCriterion(id: number, input: UpdateCriterionInput): Promise<CriterionPublic> {
  await findCriterionById(id);

  return prisma.criterion.update({
    where: { id },
    data: input,
    select: criterionSelect,
  });
}

export async function deleteCriterion(id: number): Promise<void> {
  await findCriterionById(id);

  try {
    await prisma.criterion.delete({ where: { id } });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      (error.code === 'P2003' || error.code === 'P2014')
    ) {
      throw new HttpError(
        409,
        'CRITERION_IN_USE',
        'Ce critère est utilisé par des scores ou des questions de quiz et ne peut pas être supprimé',
      );
    }
    throw error;
  }
}
