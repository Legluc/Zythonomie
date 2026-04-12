import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma';
import { HttpError } from '../lib/http-error';

// ─── Select ───────────────────────────────────────────────────────────────────

const beerSelect = {
  id: true,
  name: true,
  description: true,
  alcool: true,
  percentage_alcool: true,
  EAN: true,
  image: true,
  created_at: true,
  breweries: {
    select: {
      brewery: {
        select: {
          id: true,
          name: true,
          description: true,
          image: true,
          origin_date: true,
        },
      },
    },
  },
  categories: {
    select: {
      category: {
        select: {
          id: true,
          name: true,
          description: true,
        },
      },
    },
  },
} satisfies Prisma.BeerSelect;

export type BeerPublic = Prisma.BeerGetPayload<{ select: typeof beerSelect }>;

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface BeerFilters {
  alcool?: boolean;
  breweryId?: number;
  categoryId?: number;
}

export interface CreateBeerInput {
  name: string;
  description: string;
  alcool: boolean;
  percentage_alcool: number;
  EAN: number;
  image: string;
  brewery_ids?: number[];
  category_ids?: number[];
}

export interface UpdateBeerInput {
  name?: string;
  description?: string;
  alcool?: boolean;
  percentage_alcool?: number;
  EAN?: number;
  image?: string;
  brewery_ids?: number[];
  category_ids?: number[];
}

// ─── Service ──────────────────────────────────────────────────────────────────

export async function findAllBeers(filters: BeerFilters = {}): Promise<BeerPublic[]> {
  const where: Prisma.BeerWhereInput = { deleted_at: null };

  if (filters.alcool !== undefined) {
    where.alcool = filters.alcool;
  }
  if (filters.breweryId !== undefined) {
    where.breweries = { some: { id_brewery: filters.breweryId } };
  }
  if (filters.categoryId !== undefined) {
    where.categories = { some: { id_category: filters.categoryId } };
  }

  return prisma.beer.findMany({
    where,
    select: beerSelect,
    orderBy: { name: 'asc' },
  });
}

export async function findBeerById(id: number): Promise<BeerPublic> {
  const beer = await prisma.beer.findFirst({
    where: { id, deleted_at: null },
    select: beerSelect,
  });

  if (!beer) {
    throw new HttpError(404, 'BEER_NOT_FOUND', 'Bière introuvable');
  }

  return beer;
}

export async function createBeer(input: CreateBeerInput): Promise<BeerPublic> {
  return prisma.beer.create({
    data: {
      name: input.name,
      description: input.description,
      alcool: input.alcool,
      percentage_alcool: input.percentage_alcool,
      EAN: input.EAN,
      image: input.image,
      breweries: input.brewery_ids?.length
        ? { create: input.brewery_ids.map((id_brewery) => ({ id_brewery })) }
        : undefined,
      categories: input.category_ids?.length
        ? { create: input.category_ids.map((id_category) => ({ id_category })) }
        : undefined,
    },
    select: beerSelect,
  });
}

export async function updateBeer(id: number, input: UpdateBeerInput): Promise<BeerPublic> {
  await ensureBeerExists(id);

  return prisma.beer.update({
    where: { id },
    data: {
      name: input.name,
      description: input.description,
      alcool: input.alcool,
      percentage_alcool: input.percentage_alcool,
      EAN: input.EAN,
      image: input.image,
      // Si brewery_ids fourni (même vide) → remplace toutes les liaisons
      breweries:
        input.brewery_ids !== undefined
          ? {
              deleteMany: {},
              create: input.brewery_ids.map((id_brewery) => ({ id_brewery })),
            }
          : undefined,
      // Si category_ids fourni (même vide) → remplace toutes les liaisons
      categories:
        input.category_ids !== undefined
          ? {
              deleteMany: {},
              create: input.category_ids.map((id_category) => ({ id_category })),
            }
          : undefined,
    },
    select: beerSelect,
  });
}

export async function softDeleteBeer(id: number): Promise<void> {
  const existing = await prisma.beer.findFirst({
    where: { id, deleted_at: null },
    select: { id: true },
  });

  if (!existing) {
    throw new HttpError(404, 'BEER_NOT_FOUND', 'Bière introuvable');
  }

  await prisma.beer.update({
    where: { id },
    data: { deleted_at: new Date() },
  });
}

async function ensureBeerExists(id: number): Promise<void> {
  const beer = await prisma.beer.findFirst({
    where: { id, deleted_at: null },
    select: { id: true },
  });

  if (!beer) {
    throw new HttpError(404, 'BEER_NOT_FOUND', 'Bière introuvable');
  }
}
