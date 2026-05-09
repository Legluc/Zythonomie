import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma';
import { HttpError } from '../lib/http-error';
import { paginate, PaginatedResult } from '../lib/paginate';

const categorySelect = {
  id: true,
  name: true,
  description: true,
  id_parent_category: true,
  parentCategory: {
    select: {
      id: true,
      name: true,
    },
  },
  subCategories: {
    select: {
      id: true,
      name: true,
    },
  },
} satisfies Prisma.CategorySelect;

export type CategoryPublic = Prisma.CategoryGetPayload<{ select: typeof categorySelect }>;

export interface CategoryFilters {
  parentCategoryId?: number | null;
}

export interface CreateCategoryInput {
  name: string;
  description: string;
  id_parent_category?: number | null;
}

export interface UpdateCategoryInput {
  name?: string;
  description?: string;
  id_parent_category?: number | null;
}

export async function findAllCategories(filters: CategoryFilters = {}, page = 1, limit = 20): Promise<PaginatedResult<CategoryPublic>> {
  const where: Prisma.CategoryWhereInput = {};

  if (filters.parentCategoryId !== undefined) {
    where.id_parent_category = filters.parentCategoryId;
  }

  return paginate<CategoryPublic>(prisma.category as any, { where, select: categorySelect, orderBy: { name: 'asc' } }, page, limit);
}

export async function findCategoryById(id: number): Promise<CategoryPublic> {
  const category = await prisma.category.findUnique({
    where: { id },
    select: categorySelect,
  });

  if (!category) {
    throw new HttpError(404, 'CATEGORY_NOT_FOUND', 'Categorie introuvable');
  }

  return category;
}

export async function createCategory(input: CreateCategoryInput): Promise<CategoryPublic> {
  if (input.id_parent_category !== undefined && input.id_parent_category !== null) {
    await ensureCategoryExists(input.id_parent_category);
  }

  try {
    return await prisma.category.create({
      data: {
        name: input.name,
        description: input.description,
        id_parent_category: input.id_parent_category ?? null,
      },
      select: categorySelect,
    });
  } catch (error) {
    handlePrismaConstraintError(error, 'CATEGORY_CREATE_CONSTRAINT', 'Contrainte invalide lors de la creation de la categorie');
    throw error;
  }
}

export async function updateCategory(id: number, input: UpdateCategoryInput): Promise<CategoryPublic> {
  await ensureCategoryExists(id);

  if (input.id_parent_category !== undefined) {
    if (input.id_parent_category === id) {
      throw new HttpError(400, 'CATEGORY_PARENT_SELF', 'Une categorie ne peut pas etre son propre parent');
    }

    if (input.id_parent_category !== null) {
      await ensureCategoryExists(input.id_parent_category);
    }
  }

  try {
    return await prisma.category.update({
      where: { id },
      data: {
        name: input.name,
        description: input.description,
        id_parent_category:
          input.id_parent_category !== undefined ? (input.id_parent_category ?? null) : undefined,
      },
      select: categorySelect,
    });
  } catch (error) {
    handlePrismaConstraintError(error, 'CATEGORY_UPDATE_CONSTRAINT', 'Contrainte invalide lors de la mise a jour de la categorie');
    throw error;
  }
}

export async function deleteCategory(id: number): Promise<void> {
  await ensureCategoryExists(id);

  try {
    await prisma.category.delete({
      where: { id },
    });
  } catch (error) {
    handlePrismaConstraintError(error, 'CATEGORY_DELETE_CONSTRAINT', 'Impossible de supprimer cette categorie car elle est liee a d autres donnees');
    throw error;
  }
}

async function ensureCategoryExists(id: number): Promise<void> {
  const category = await prisma.category.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!category) {
    throw new HttpError(404, 'CATEGORY_NOT_FOUND', 'Categorie introuvable');
  }
}

function handlePrismaConstraintError(error: unknown, code: string, message: string): void {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2003' || error.code === 'P2014') {
      throw new HttpError(409, code, message);
    }
  }
}
