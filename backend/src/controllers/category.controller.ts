import { Request, Response } from 'express';
import { sendSuccess } from '../lib/response';
import {
  CategoryFilters,
  createCategory,
  deleteCategory,
  findAllCategories,
  findCategoryById,
  updateCategory,
} from '../services/category.service';

export async function getCategories(req: Request, res: Response): Promise<void> {
  const filters: CategoryFilters = {};

  if (req.query.parentCategoryId !== undefined) {
    if (req.query.parentCategoryId === 'null') {
      filters.parentCategoryId = null;
    } else {
      filters.parentCategoryId = Number(req.query.parentCategoryId);
    }
  }

  const categories = await findAllCategories(filters);
  sendSuccess(res, 200, categories);
}

export async function getCategoryById(req: Request, res: Response): Promise<void> {
  const categoryId = Number(req.params.id);
  const category = await findCategoryById(categoryId);
  sendSuccess(res, 200, category);
}

export async function postCategory(req: Request, res: Response): Promise<void> {
  const category = await createCategory(req.body);
  sendSuccess(res, 201, category);
}

export async function putCategory(req: Request, res: Response): Promise<void> {
  const categoryId = Number(req.params.id);
  const category = await updateCategory(categoryId, req.body);
  sendSuccess(res, 200, category);
}

export async function deleteCategoryHandler(req: Request, res: Response): Promise<void> {
  const categoryId = Number(req.params.id);
  await deleteCategory(categoryId);
  sendSuccess(res, 200, { id: categoryId, deleted: true });
}
