import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma';
import { HttpError } from '../lib/http-error';

const beerCriteriaSelect = {
  id_criterion: true,
  id_beer: true,
  score: true,
  criterion: {
    select: {
      id: true,
      name: true,
    },
  },
  beer: {
    select: {
      id: true,
      name: true,
    },
  },
} satisfies Prisma.BeerCriteriaSelect;

export type BeerCriteriaPublic = Prisma.BeerCriteriaGetPayload<{ select: typeof beerCriteriaSelect }>;

export interface UpsertBeerCriteriaInput {
  id_criterion: number;
  id_beer: number;
  score: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function ensureBeerActive(id_beer: number): Promise<void> {
  const beer = await prisma.beer.findUnique({ where: { id: id_beer }, select: { deleted_at: true } });
  if (!beer || beer.deleted_at !== null) {
    throw new HttpError(404, 'BEER_NOT_FOUND', 'Bière introuvable ou supprimée');
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

export async function findCriteriaByBeer(id_beer: number): Promise<BeerCriteriaPublic[]> {
  return prisma.beerCriteria.findMany({
    where: { id_beer },
    select: beerCriteriaSelect,
    orderBy: { id_criterion: 'asc' },
  });
}

export async function findBeerCriteriaEntry(id_criterion: number, id_beer: number): Promise<BeerCriteriaPublic> {
  const entry = await prisma.beerCriteria.findUnique({
    where: { id_criterion_id_beer: { id_criterion, id_beer } },
    select: beerCriteriaSelect,
  });

  if (!entry) {
    throw new HttpError(404, 'BEER_CRITERIA_NOT_FOUND', 'Score bière introuvable pour ce critère');
  }

  return entry;
}

// ─── Mutations ───────────────────────────────────────────────────────────────

export async function upsertBeerCriteria(input: UpsertBeerCriteriaInput): Promise<BeerCriteriaPublic> {
  validateScore(input.score);
  await ensureBeerActive(input.id_beer);
  await ensureCriterionExists(input.id_criterion);

  return prisma.beerCriteria.upsert({
    where: {
      id_criterion_id_beer: {
        id_criterion: input.id_criterion,
        id_beer: input.id_beer,
      },
    },
    create: {
      id_criterion: input.id_criterion,
      id_beer: input.id_beer,
      score: input.score,
    },
    update: {
      score: input.score,
    },
    select: beerCriteriaSelect,
  });
}

export async function deleteBeerCriteria(id_criterion: number, id_beer: number): Promise<void> {
  await findBeerCriteriaEntry(id_criterion, id_beer);

  await prisma.beerCriteria.delete({
    where: { id_criterion_id_beer: { id_criterion, id_beer } },
  });
}
