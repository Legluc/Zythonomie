import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma';
import { HttpError } from '../lib/http-error';

const pairingSelect = {
  id: true,
  name: true,
  description: true,
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
} satisfies Prisma.PairingSelect;

export type PairingPublic = Prisma.PairingGetPayload<{ select: typeof pairingSelect }>;

export interface CreatePairingInput {
  name: string;
  description: string;
  category_ids?: number[];
}

export interface UpdatePairingInput {
  name?: string;
  description?: string;
  category_ids?: number[];
}

export async function findAllPairings(): Promise<PairingPublic[]> {
  return prisma.pairing.findMany({
    select: pairingSelect,
    orderBy: { name: 'asc' },
  });
}

export async function findPairingById(id: number): Promise<PairingPublic> {
  const pairing = await prisma.pairing.findUnique({
    where: { id },
    select: pairingSelect,
  });

  if (!pairing) {
    throw new HttpError(404, 'PAIRING_NOT_FOUND', 'Pairing introuvable');
  }

  return pairing;
}

export async function createPairing(input: CreatePairingInput): Promise<PairingPublic> {
  if (input.category_ids?.length) {
    await ensureCategoriesExist(input.category_ids);
  }

  try {
    return await prisma.pairing.create({
      data: {
        name: input.name,
        description: input.description,
        categories: input.category_ids?.length
          ? { create: input.category_ids.map((id_category) => ({ id_category })) }
          : undefined,
      },
      select: pairingSelect,
    });
  } catch (error) {
    handlePrismaConstraintError(error, 'PAIRING_CREATE_CONSTRAINT', 'Contrainte invalide lors de la creation du pairing');
    throw error;
  }
}

export async function updatePairing(id: number, input: UpdatePairingInput): Promise<PairingPublic> {
  await ensurePairingExists(id);

  if (input.category_ids !== undefined && input.category_ids.length > 0) {
    await ensureCategoriesExist(input.category_ids);
  }

  try {
    return await prisma.pairing.update({
      where: { id },
      data: {
        name: input.name,
        description: input.description,
        categories:
          input.category_ids !== undefined
            ? {
                deleteMany: {},
                create: input.category_ids.map((id_category) => ({ id_category })),
              }
            : undefined,
      },
      select: pairingSelect,
    });
  } catch (error) {
    handlePrismaConstraintError(error, 'PAIRING_UPDATE_CONSTRAINT', 'Contrainte invalide lors de la mise a jour du pairing');
    throw error;
  }
}

export async function deletePairing(id: number): Promise<void> {
  await ensurePairingExists(id);

  try {
    await prisma.pairing.delete({
      where: { id },
    });
  } catch (error) {
    handlePrismaConstraintError(error, 'PAIRING_DELETE_CONSTRAINT', 'Impossible de supprimer ce pairing car il est lie a d autres donnees');
    throw error;
  }
}

async function ensurePairingExists(id: number): Promise<void> {
  const pairing = await prisma.pairing.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!pairing) {
    throw new HttpError(404, 'PAIRING_NOT_FOUND', 'Pairing introuvable');
  }
}

async function ensureCategoriesExist(categoryIds: number[]): Promise<void> {
  const uniqueIds = [...new Set(categoryIds)];

  const count = await prisma.category.count({
    where: {
      id: { in: uniqueIds },
    },
  });

  if (count !== uniqueIds.length) {
    throw new HttpError(409, 'PAIRING_CATEGORY_CONSTRAINT', 'Une ou plusieurs categories sont introuvables');
  }
}

function handlePrismaConstraintError(error: unknown, code: string, message: string): void {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2003' || error.code === 'P2014') {
      throw new HttpError(409, code, message);
    }
  }
}
