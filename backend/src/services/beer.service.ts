import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma';
import { HttpError } from '../lib/http-error';
import { paginate, PaginatedResult } from '../lib/paginate';

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

export async function findAllBeers(filters: BeerFilters = {}, page = 1, limit = 20): Promise<PaginatedResult<BeerPublic>> {
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

  return paginate<BeerPublic>(prisma.beer as any, { where, select: beerSelect, orderBy: { name: 'asc' } }, page, limit);
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

// ─── Liaisons atomiques Brewery ───────────────────────────────────────────────

export async function addBreweryToBeer(id_beer: number, id_brewery: number): Promise<BeerPublic> {
  await ensureBeerExists(id_beer);

  const brewery = await prisma.brewery.findUnique({ where: { id: id_brewery }, select: { id: true } });
  if (!brewery) {
    throw new HttpError(404, 'BREWERY_NOT_FOUND', 'Brasserie introuvable');
  }

  const existing = await prisma.beerByBrewery.findUnique({
    where: { id_brewery_id_beer: { id_brewery, id_beer } },
    select: { id_beer: true },
  });
  if (existing) {
    throw new HttpError(409, 'LINK_ALREADY_EXISTS', 'Cette brasserie est déjà liée à la bière');
  }

  await prisma.beerByBrewery.create({ data: { id_beer, id_brewery } });
  return findBeerById(id_beer);
}

export async function removeBreweryFromBeer(id_beer: number, id_brewery: number): Promise<BeerPublic> {
  await ensureBeerExists(id_beer);

  const existing = await prisma.beerByBrewery.findUnique({
    where: { id_brewery_id_beer: { id_brewery, id_beer } },
    select: { id_beer: true },
  });
  if (!existing) {
    throw new HttpError(404, 'LINK_NOT_FOUND', 'Cette brasserie n\'est pas liée à la bière');
  }

  await prisma.beerByBrewery.delete({ where: { id_brewery_id_beer: { id_brewery, id_beer } } });
  return findBeerById(id_beer);
}

// ─── Liaisons atomiques Category ──────────────────────────────────────────────

export async function addCategoryToBeer(id_beer: number, id_category: number): Promise<BeerPublic> {
  await ensureBeerExists(id_beer);

  const category = await prisma.category.findUnique({ where: { id: id_category }, select: { id: true } });
  if (!category) {
    throw new HttpError(404, 'CATEGORY_NOT_FOUND', 'Catégorie introuvable');
  }

  const existing = await prisma.beerByCategory.findUnique({
    where: { id_beer_id_category: { id_beer, id_category } },
    select: { id_beer: true },
  });
  if (existing) {
    throw new HttpError(409, 'LINK_ALREADY_EXISTS', 'Cette catégorie est déjà liée à la bière');
  }

  await prisma.beerByCategory.create({ data: { id_beer, id_category } });
  return findBeerById(id_beer);
}

export async function removeCategoryFromBeer(id_beer: number, id_category: number): Promise<BeerPublic> {
  await ensureBeerExists(id_beer);

  const existing = await prisma.beerByCategory.findUnique({
    where: { id_beer_id_category: { id_beer, id_category } },
    select: { id_beer: true },
  });
  if (!existing) {
    throw new HttpError(404, 'LINK_NOT_FOUND', 'Cette catégorie n\'est pas liée à la bière');
  }

  await prisma.beerByCategory.delete({ where: { id_beer_id_category: { id_beer, id_category } } });
  return findBeerById(id_beer);
}
