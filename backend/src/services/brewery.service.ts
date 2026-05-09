import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma';
import { HttpError } from '../lib/http-error';
import { paginate, PaginatedResult } from '../lib/paginate';

const brewerySelect = {
  id: true,
  name: true,
  description: true,
  image: true,
  origin_date: true,
  beers: {
    select: {
      beer: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
    },
  },
} satisfies Prisma.BrewerySelect;

export type BreweryPublic = Prisma.BreweryGetPayload<{ select: typeof brewerySelect }>;

export interface CreateBreweryInput {
  name: string;
  description: string;
  image: string;
  origin_date: Date;
}

export interface UpdateBreweryInput {
  name?: string;
  description?: string;
  image?: string;
  origin_date?: Date;
}

export async function findAllBreweries(page = 1, limit = 20): Promise<PaginatedResult<BreweryPublic>> {
  return paginate<BreweryPublic>(
    prisma.brewery as any,
    { where: {}, select: brewerySelect, orderBy: { name: 'asc' } },
    page,
    limit,
  );
}

export async function findBreweryById(id: number): Promise<BreweryPublic> {
  const brewery = await prisma.brewery.findUnique({
    where: { id },
    select: brewerySelect,
  });

  if (!brewery) {
    throw new HttpError(404, 'BREWERY_NOT_FOUND', 'Brasserie introuvable');
  }

  return brewery;
}

export async function createBrewery(input: CreateBreweryInput): Promise<BreweryPublic> {
  try {
    return await prisma.brewery.create({
      data: {
        name: input.name,
        description: input.description,
        image: input.image,
        origin_date: input.origin_date,
      },
      select: brewerySelect,
    });
  } catch (error) {
    handlePrismaConstraintError(error, 'BREWERY_CREATE_CONSTRAINT', 'Contrainte invalide lors de la creation de la brasserie');
    throw error;
  }
}

export async function updateBrewery(id: number, input: UpdateBreweryInput): Promise<BreweryPublic> {
  await ensureBreweryExists(id);

  try {
    return await prisma.brewery.update({
      where: { id },
      data: {
        name: input.name,
        description: input.description,
        image: input.image,
        origin_date: input.origin_date,
      },
      select: brewerySelect,
    });
  } catch (error) {
    handlePrismaConstraintError(error, 'BREWERY_UPDATE_CONSTRAINT', 'Contrainte invalide lors de la mise a jour de la brasserie');
    throw error;
  }
}

export async function deleteBrewery(id: number): Promise<void> {
  await ensureBreweryExists(id);

  try {
    await prisma.brewery.delete({
      where: { id },
    });
  } catch (error) {
    handlePrismaConstraintError(error, 'BREWERY_DELETE_CONSTRAINT', 'Impossible de supprimer cette brasserie car elle est liee a d autres donnees');
    throw error;
  }
}

async function ensureBreweryExists(id: number): Promise<void> {
  const brewery = await prisma.brewery.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!brewery) {
    throw new HttpError(404, 'BREWERY_NOT_FOUND', 'Brasserie introuvable');
  }
}

function handlePrismaConstraintError(error: unknown, code: string, message: string): void {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2003' || error.code === 'P2014') {
      throw new HttpError(409, code, message);
    }
  }
}
