import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma';
import { HttpError } from '../lib/http-error';
import { paginate, PaginatedResult } from '../lib/paginate';

export interface RecommendationItem {
  id_user: number;
  id_beer: number;
  score_compatibility: Prisma.Decimal;
  beer: {
    id: number;
    name: string;
    image: string;
    alcool: boolean;
    percentage_alcool: Prisma.Decimal;
  };
}

const recommendationSelect = {
  id_user: true,
  id_beer: true,
  score_compatibility: true,
  beer: {
    select: {
      id: true,
      name: true,
      image: true,
      alcool: true,
      percentage_alcool: true,
    },
  },
} as const;

export async function getRecommendationsForUser(userId: number, page = 1, limit = 20): Promise<PaginatedResult<RecommendationItem>> {
  await ensureActiveUser(userId);

  // Auto-refresh si aucune recommandation n'a encore ete calculee
  const existingCount = await prisma.beerRecommendedUser.count({
    where: { id_user: userId },
  });
  if (existingCount === 0) {
    await computeAndStoreRecommendations(userId);
  }

  return paginate<RecommendationItem>(
    prisma.beerRecommendedUser as any,
    {
      where: { id_user: userId, beer: { deleted_at: null } },
      select: recommendationSelect,
      orderBy: [{ score_compatibility: 'desc' }, { id_beer: 'asc' }],
    },
    page,
    limit,
  );
}

export async function refreshRecommendationsForUser(userId: number, page = 1, limit = 20): Promise<PaginatedResult<RecommendationItem>> {
  await ensureActiveUser(userId);
  await computeAndStoreRecommendations(userId);

  return paginate<RecommendationItem>(
    prisma.beerRecommendedUser as any,
    {
      where: { id_user: userId, beer: { deleted_at: null } },
      select: recommendationSelect,
      orderBy: [{ score_compatibility: 'desc' }, { id_beer: 'asc' }],
    },
    page,
    limit,
  );
}

async function computeAndStoreRecommendations(userId: number): Promise<void> {

  const userCriteria = await prisma.userCriteria.findMany({
    where: { id_user: userId },
    select: {
      id_criterion: true,
      score: true,
    },
  });

  if (userCriteria.length === 0) {
    await prisma.beerRecommendedUser.deleteMany({ where: { id_user: userId } });
    return;
  }

  const userMap = new Map<number, number>();
  for (const criterion of userCriteria) {
    userMap.set(criterion.id_criterion, criterion.score.toNumber());
  }

  const beers = await prisma.beer.findMany({
    where: { deleted_at: null },
    select: {
      id: true,
      name: true,
      image: true,
      alcool: true,
      percentage_alcool: true,
      criterias: {
        select: {
          id_criterion: true,
          score: true,
        },
      },
    },
  });

  const scored = beers
    .map((beer) => {
      let dotProduct = 0;
      let overlapCount = 0;

      for (const beerCriterion of beer.criterias) {
        const userScore = userMap.get(beerCriterion.id_criterion);
        if (userScore === undefined) {
          continue;
        }

        dotProduct += userScore * beerCriterion.score.toNumber();
        overlapCount += 1;
      }

      if (overlapCount === 0) {
        return null;
      }

      const normalizedScore = dotProduct / overlapCount;

      return {
        id_user: userId,
        id_beer: beer.id,
        score_compatibility: new Prisma.Decimal(normalizedScore.toFixed(2)),
      };
    })
    .filter((item): item is { id_user: number; id_beer: number; score_compatibility: Prisma.Decimal } => item !== null)
    .sort((a, b) => b.score_compatibility.comparedTo(a.score_compatibility));

  await prisma.$transaction([
    prisma.beerRecommendedUser.deleteMany({ where: { id_user: userId } }),
    ...scored.map((item) =>
      prisma.beerRecommendedUser.create({
        data: item,
      }),
    ),
  ]);
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
