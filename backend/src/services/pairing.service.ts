import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma';
import { HttpError } from '../lib/http-error';
import { paginate, PaginatedResult } from '../lib/paginate';

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

export async function findAllPairings(page = 1, limit = 20): Promise<PaginatedResult<PairingPublic>> {
  return paginate<PairingPublic>(
    prisma.pairing as any,
    { where: {}, select: pairingSelect, orderBy: { name: 'asc' } },
    page,
    limit,
  );
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

// ─── Liaisons atomiques Category ──────────────────────────────────────────────

export async function addCategoryToPairing(id_pairing: number, id_category: number): Promise<PairingPublic> {
  await ensurePairingExists(id_pairing);
  await ensureCategoriesExist([id_category]);

  const existing = await prisma.pairingByCategory.findUnique({
    where: { id_pairing_id_category: { id_pairing, id_category } },
    select: { id_pairing: true },
  });
  if (existing) {
    throw new HttpError(409, 'LINK_ALREADY_EXISTS', 'Cette catégorie est déjà liée à ce pairing');
  }

  await prisma.pairingByCategory.create({ data: { id_pairing, id_category } });
  return findPairingById(id_pairing);
}

export async function removeCategoryFromPairing(id_pairing: number, id_category: number): Promise<PairingPublic> {
  await ensurePairingExists(id_pairing);

  const existing = await prisma.pairingByCategory.findUnique({
    where: { id_pairing_id_category: { id_pairing, id_category } },
    select: { id_pairing: true },
  });
  if (!existing) {
    throw new HttpError(404, 'LINK_NOT_FOUND', 'Cette catégorie n\'est pas liée à ce pairing');
  }

  await prisma.pairingByCategory.delete({ where: { id_pairing_id_category: { id_pairing, id_category } } });
  return findPairingById(id_pairing);
}
