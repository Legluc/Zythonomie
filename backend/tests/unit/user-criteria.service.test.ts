import { describe, it, expect } from 'vitest';
import { withTestTransaction } from '../helpers/with-transaction';
import { createTestUser, createTestCriterion } from '../helpers/factories';
import prisma from '../../src/lib/prisma';
import {
  findCriteriaByUser,
  findUserCriteriaEntry,
  upsertUserCriteria,
  deleteUserCriteria,
} from '../../src/services/user-criteria.service';

describe('user-criteria.service', () => {
  it('upsertUserCriteria creates a new entry', async () => {
    await withTestTransaction(async () => {
      const user = await createTestUser();
      const criterion = await createTestCriterion();

      const entry = await upsertUserCriteria({
        id_user: user.id,
        id_criterion: criterion.id,
        score: 3.5,
      });

      expect(entry.id_user).toBe(user.id);
      expect(entry.id_criterion).toBe(criterion.id);
      expect(Number(entry.score)).toBeCloseTo(3.5);
    });
  });

  it('upsertUserCriteria updates an existing entry', async () => {
    await withTestTransaction(async () => {
      const user = await createTestUser();
      const criterion = await createTestCriterion();

      await upsertUserCriteria({ id_user: user.id, id_criterion: criterion.id, score: 2 });
      const updated = await upsertUserCriteria({ id_user: user.id, id_criterion: criterion.id, score: 4.5 });

      expect(Number(updated.score)).toBeCloseTo(4.5);
    });
  });

  it('upsertUserCriteria throws 422 for score < 0', async () => {
    await withTestTransaction(async () => {
      const user = await createTestUser();
      const criterion = await createTestCriterion();

      await expect(
        upsertUserCriteria({ id_user: user.id, id_criterion: criterion.id, score: -1 }),
      ).rejects.toMatchObject({ statusCode: 422, code: 'INVALID_SCORE' });
    });
  });

  it('upsertUserCriteria throws 422 for score > 5', async () => {
    await withTestTransaction(async () => {
      const user = await createTestUser();
      const criterion = await createTestCriterion();

      await expect(
        upsertUserCriteria({ id_user: user.id, id_criterion: criterion.id, score: 6 }),
      ).rejects.toMatchObject({ statusCode: 422, code: 'INVALID_SCORE' });
    });
  });

  it('upsertUserCriteria throws 404 for deleted user', async () => {
    await withTestTransaction(async () => {
      const user = await createTestUser();
      const criterion = await createTestCriterion();

      await prisma.user.update({ where: { id: user.id }, data: { deleted_at: new Date() } });

      await expect(
        upsertUserCriteria({ id_user: user.id, id_criterion: criterion.id, score: 3 }),
      ).rejects.toMatchObject({ statusCode: 404, code: 'USER_NOT_FOUND' });
    });
  });

  it('findCriteriaByUser returns all criteria for a user', async () => {
    await withTestTransaction(async () => {
      const user = await createTestUser();
      const c1 = await createTestCriterion();
      const c2 = await createTestCriterion();

      await upsertUserCriteria({ id_user: user.id, id_criterion: c1.id, score: 1 });
      await upsertUserCriteria({ id_user: user.id, id_criterion: c2.id, score: 2 });

      const criteria = await findCriteriaByUser(user.id);
      expect(criteria.length).toBe(2);
    });
  });

  it('deleteUserCriteria removes the entry', async () => {
    await withTestTransaction(async () => {
      const user = await createTestUser();
      const criterion = await createTestCriterion();

      await upsertUserCriteria({ id_user: user.id, id_criterion: criterion.id, score: 3 });
      await deleteUserCriteria(user.id, criterion.id);

      await expect(findUserCriteriaEntry(user.id, criterion.id)).rejects.toMatchObject({
        statusCode: 404,
        code: 'USER_CRITERIA_NOT_FOUND',
      });
    });
  });
});
