import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma';
import { HttpError } from '../lib/http-error';
import { paginate, PaginatedResult } from '../lib/paginate';

const ratingSelect = {
  id: true,
  id_user: true,
  id_beer: true,
  content: true,
  rate: true,
  created_at: true,
  deleted_at: true,
  user: {
    select: {
      id: true,
      firstname: true,
      name: true,
      mail: true,
    },
  },
  beer: {
    select: {
      id: true,
      name: true,
      alcool: true,
    },
  },
} satisfies Prisma.RatingSelect;

export type RatingPublic = Prisma.RatingGetPayload<{ select: typeof ratingSelect }>;

export interface CreateRatingInput {
  id_user: number;
  id_beer: number;
  content: string;
  rate: number;
}

export interface UpdateRatingInput {
  content?: string;
  rate?: number;
}

export async function findRatingsByBeer(beerId: number, page = 1, limit = 20): Promise<PaginatedResult<RatingPublic>> {
  return paginate<RatingPublic>(
    prisma.rating as any,
    { where: { id_beer: beerId, deleted_at: null }, select: ratingSelect, orderBy: { created_at: 'desc' } },
    page,
    limit,
  );
}

export async function findRatingsByUser(userId: number, page = 1, limit = 20): Promise<PaginatedResult<RatingPublic>> {
  return paginate<RatingPublic>(
    prisma.rating as any,
    { where: { id_user: userId, deleted_at: null }, select: ratingSelect, orderBy: { created_at: 'desc' } },
    page,
    limit,
  );
}

export async function createRating(input: CreateRatingInput): Promise<RatingPublic> {
  await ensureActiveUser(input.id_user);
  await ensureActiveBeer(input.id_beer);

  const existing = await prisma.rating.findFirst({
    where: {
      id_user: input.id_user,
      id_beer: input.id_beer,
      deleted_at: null,
    },
    select: { id: true },
  });

  if (existing) {
    throw new HttpError(409, 'RATING_ALREADY_EXISTS', 'Une seule note est autorisee par couple user-beer');
  }

  return prisma.rating.create({
    data: {
      id_user: input.id_user,
      id_beer: input.id_beer,
      content: input.content,
      rate: input.rate,
    },
    select: ratingSelect,
  });
}

export interface RequestingUser {
  id: number;
  role: string;
}

export async function updateRating(
  id: number,
  input: UpdateRatingInput,
  requestingUser?: RequestingUser,
): Promise<RatingPublic> {
  const rating = await findActiveRating(id);

  if (requestingUser && requestingUser.role !== 'ADMIN' && rating.id_user !== requestingUser.id) {
    throw new HttpError(403, 'FORBIDDEN', 'Vous ne pouvez modifier que vos propres notes');
  }

  return prisma.rating.update({
    where: { id },
    data: {
      content: input.content,
      rate: input.rate,
    },
    select: ratingSelect,
  });
}

export async function softDeleteRating(id: number, requestingUser?: RequestingUser): Promise<void> {
  const rating = await findActiveRating(id);

  if (requestingUser && requestingUser.role !== 'ADMIN' && rating.id_user !== requestingUser.id) {
    throw new HttpError(403, 'FORBIDDEN', 'Vous ne pouvez supprimer que vos propres notes');
  }

  await prisma.rating.update({
    where: { id },
    data: { deleted_at: new Date() },
  });
}

async function findActiveRating(id: number): Promise<{ id: number; id_user: number }> {
  const rating = await prisma.rating.findFirst({
    where: { id, deleted_at: null },
    select: { id: true, id_user: true },
  });

  if (!rating) {
    throw new HttpError(404, 'RATING_NOT_FOUND', 'Note introuvable');
  }

  return rating;
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

async function ensureActiveBeer(id: number): Promise<void> {
  const beer = await prisma.beer.findFirst({
    where: { id, deleted_at: null },
    select: { id: true },
  });

  if (!beer) {
    throw new HttpError(404, 'BEER_NOT_FOUND', 'Biere introuvable');
  }
}
