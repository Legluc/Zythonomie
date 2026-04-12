import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma';
import { HttpError } from '../lib/http-error';

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

export async function getRecommendationsForUser(userId: number, limit = 10): Promise<RecommendationItem[]> {
  await ensureActiveUser(userId);

  const items = await prisma.beerRecommendedUser.findMany({
    where: {
      id_user: userId,
      beer: {
        deleted_at: null,
      },
    },
    select: {
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
    },
    orderBy: [{ score_compatibility: 'desc' }, { id_beer: 'asc' }],
    take: limit,
  });

  if (items.length > 0) {
    return items;
  }

  return refreshRecommendationsForUser(userId, limit);
}

export async function refreshRecommendationsForUser(userId: number, limit = 10): Promise<RecommendationItem[]> {
  await ensureActiveUser(userId);

  const userCriteria = await prisma.userCriteria.findMany({
    where: { id_user: userId },
    select: {
      id_criterion: true,
      score: true,
    },
  });

  if (userCriteria.length === 0) {
    await prisma.beerRecommendedUser.deleteMany({ where: { id_user: userId } });
    return [];
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
      let totalAbsDiff = 0;
      let overlapCount = 0;

      for (const beerCriterion of beer.criterias) {
        const userScore = userMap.get(beerCriterion.id_criterion);
        if (userScore === undefined) {
          continue;
        }

        totalAbsDiff += Math.abs(userScore - beerCriterion.score.toNumber());
        overlapCount += 1;
      }

      if (overlapCount === 0) {
        return null;
      }

      const avgAbsDiff = totalAbsDiff / overlapCount;
      const normalizedScore = Math.max(0, 1 - avgAbsDiff / 5);

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

  return prisma.beerRecommendedUser.findMany({
    where: {
      id_user: userId,
      beer: {
        deleted_at: null,
      },
    },
    select: {
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
    },
    orderBy: [{ score_compatibility: 'desc' }, { id_beer: 'asc' }],
    take: limit,
  });
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
