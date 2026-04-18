import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma';
import { HttpError } from '../lib/http-error';

const userCriteriaSelect = {
  id_user: true,
  id_criterion: true,
  score: true,
  criterion: {
    select: {
      id: true,
      name: true,
    },
  },
} satisfies Prisma.UserCriteriaSelect;

export type UserCriteriaPublic = Prisma.UserCriteriaGetPayload<{ select: typeof userCriteriaSelect }>;

export interface UpsertUserCriteriaInput {
  id_user: number;
  id_criterion: number;
  score: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function ensureUserActive(id_user: number): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: id_user }, select: { deleted_at: true } });
  if (!user || user.deleted_at !== null) {
    throw new HttpError(404, 'USER_NOT_FOUND', 'Utilisateur introuvable ou supprimé');
  }
}

async function ensureCriterionExists(id_criterion: number): Promise<void> {
  const criterion = await prisma.criterion.findUnique({ where: { id: id_criterion }, select: { id: true } });
  if (!criterion) {
    throw new HttpError(404, 'CRITERION_NOT_FOUND', 'Critère introuvable');
  }
}

function validateScore(score: number): void {
  if (score < 0 || score > 5) {
    throw new HttpError(422, 'INVALID_SCORE', 'Le score doit être compris entre 0 et 5');
  }
}

// ─── Queries ─────────────────────────────────────────────────────────────────

export async function findCriteriaByUser(id_user: number): Promise<UserCriteriaPublic[]> {
  return prisma.userCriteria.findMany({
    where: { id_user },
    select: userCriteriaSelect,
    orderBy: { id_criterion: 'asc' },
  });
}

export async function findUserCriteriaEntry(id_user: number, id_criterion: number): Promise<UserCriteriaPublic> {
  const entry = await prisma.userCriteria.findUnique({
    where: { id_user_id_criterion: { id_user, id_criterion } },
    select: userCriteriaSelect,
  });

  if (!entry) {
    throw new HttpError(404, 'USER_CRITERIA_NOT_FOUND', 'Score utilisateur introuvable pour ce critère');
  }

  return entry;
}

// ─── Mutations ───────────────────────────────────────────────────────────────

export async function upsertUserCriteria(input: UpsertUserCriteriaInput): Promise<UserCriteriaPublic> {
  validateScore(input.score);
  await ensureUserActive(input.id_user);
  await ensureCriterionExists(input.id_criterion);

  return prisma.userCriteria.upsert({
    where: {
      id_user_id_criterion: {
        id_user: input.id_user,
        id_criterion: input.id_criterion,
      },
    },
    create: {
      id_user: input.id_user,
      id_criterion: input.id_criterion,
      score: input.score,
    },
    update: {
      score: input.score,
    },
    select: userCriteriaSelect,
  });
}

export async function deleteUserCriteria(id_user: number, id_criterion: number): Promise<void> {
  await findUserCriteriaEntry(id_user, id_criterion);

  await prisma.userCriteria.delete({
    where: { id_user_id_criterion: { id_user, id_criterion } },
  });
}
