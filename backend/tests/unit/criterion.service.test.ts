import { describe, it, expect } from 'vitest';
import { withTestTransaction } from '../helpers/with-transaction';
import { createTestCriterion, createTestQuiz } from '../helpers/factories';
import prisma from '../../src/lib/prisma';
import {
  findAllCriteria,
  findCriterionById,
  createCriterion,
  updateCriterion,
  deleteCriterion,
} from '../../src/services/criterion.service';

describe('criterion.service', () => {
  it('findAllCriteria returns criteria list', async () => {
    await withTestTransaction(async () => {
      await createTestCriterion({ name: 'crit_test_all' });
      const criteria = await findAllCriteria();
      expect(criteria.length).toBeGreaterThan(0);
      expect(criteria.some((c) => c.name === 'crit_test_all')).toBe(true);
    });
  });

  it('findCriterionById returns a criterion', async () => {
    await withTestTransaction(async () => {
      const created = await createTestCriterion();
      const found = await findCriterionById(created.id);
      expect(found.id).toBe(created.id);
      expect(found.name).toBe(created.name);
    });
  });

  it('findCriterionById throws 404 for non-existent', async () => {
    await withTestTransaction(async () => {
      await expect(findCriterionById(999999)).rejects.toMatchObject({
        statusCode: 404,
        code: 'CRITERION_NOT_FOUND',
      });
    });
  });

  it('createCriterion creates and returns', async () => {
    await withTestTransaction(async () => {
      const result = await createCriterion({
        name: 'new_test_crit',
        description: 'A new criterion',
      });
      expect(result.name).toBe('new_test_crit');
      expect(result.description).toBe('A new criterion');
      expect(result.id).toBeDefined();
    });
  });

  it('updateCriterion updates and returns', async () => {
    await withTestTransaction(async () => {
      const created = await createTestCriterion();
      const updated = await updateCriterion(created.id, { name: 'updated_name' });
      expect(updated.name).toBe('updated_name');
    });
  });

  it('updateCriterion throws 404 for non-existent', async () => {
    await withTestTransaction(async () => {
      await expect(updateCriterion(999999, { name: 'x' })).rejects.toMatchObject({
        statusCode: 404,
        code: 'CRITERION_NOT_FOUND',
      });
    });
  });

  it('deleteCriterion deletes successfully', async () => {
    await withTestTransaction(async () => {
      const created = await createTestCriterion();
      await deleteCriterion(created.id);
      await expect(findCriterionById(created.id)).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });

  it('deleteCriterion throws 409 if criterion is in use', async () => {
    await withTestTransaction(async () => {
      const criterion = await createTestCriterion();
      const quiz = await createTestQuiz();
      // quizz_question → criterion is ON DELETE RESTRICT → triggers P2003
      await prisma.quizzQuestion.create({
        data: { id_criterion: criterion.id, id_quizz: quiz.id, question: 'Test?' },
      });

      await expect(deleteCriterion(criterion.id)).rejects.toMatchObject({
        statusCode: 409,
        code: 'CRITERION_IN_USE',
      });
    });
  });
});
