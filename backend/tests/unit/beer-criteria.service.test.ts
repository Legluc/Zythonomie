import { describe, it, expect } from 'vitest';
import { withTestTransaction } from '../helpers/with-transaction';
import { createTestBeer, createTestCriterion } from '../helpers/factories';
import prisma from '../../src/lib/prisma';
import {
  findCriteriaByBeer,
  findBeerCriteriaEntry,
  upsertBeerCriteria,
  deleteBeerCriteria,
} from '../../src/services/beer-criteria.service';

describe('beer-criteria.service', () => {
  it('upsertBeerCriteria creates a new entry', async () => {
    await withTestTransaction(async () => {
      const beer = await createTestBeer();
      const criterion = await createTestCriterion();

      const entry = await upsertBeerCriteria({
        id_beer: beer.id,
        id_criterion: criterion.id,
        score: 4,
      });

      expect(entry.id_beer).toBe(beer.id);
      expect(Number(entry.score)).toBeCloseTo(4);
    });
  });

  it('upsertBeerCriteria updates an existing entry', async () => {
    await withTestTransaction(async () => {
      const beer = await createTestBeer();
      const criterion = await createTestCriterion();

      await upsertBeerCriteria({ id_beer: beer.id, id_criterion: criterion.id, score: 2 });
      const updated = await upsertBeerCriteria({ id_beer: beer.id, id_criterion: criterion.id, score: 4.5 });

      expect(Number(updated.score)).toBeCloseTo(4.5);
    });
  });

  it('upsertBeerCriteria throws 404 for deleted beer', async () => {
    await withTestTransaction(async () => {
      const beer = await createTestBeer();
      const criterion = await createTestCriterion();

      await prisma.beer.update({ where: { id: beer.id }, data: { deleted_at: new Date() } });

      await expect(
        upsertBeerCriteria({ id_beer: beer.id, id_criterion: criterion.id, score: 3 }),
      ).rejects.toMatchObject({ statusCode: 404, code: 'BEER_NOT_FOUND' });
    });
  });

  it('upsertBeerCriteria throws 404 for non-existent criterion', async () => {
    await withTestTransaction(async () => {
      const beer = await createTestBeer();

      await expect(
        upsertBeerCriteria({ id_beer: beer.id, id_criterion: 999999, score: 3 }),
      ).rejects.toMatchObject({ statusCode: 404, code: 'CRITERION_NOT_FOUND' });
    });
  });

  it('upsertBeerCriteria throws 422 for score out of bounds', async () => {
    await withTestTransaction(async () => {
      const beer = await createTestBeer();
      const criterion = await createTestCriterion();

      await expect(
        upsertBeerCriteria({ id_beer: beer.id, id_criterion: criterion.id, score: -1 }),
      ).rejects.toMatchObject({ statusCode: 422, code: 'INVALID_SCORE' });
    });
  });

  it('findCriteriaByBeer returns criteria for a beer', async () => {
    await withTestTransaction(async () => {
      const beer = await createTestBeer();
      const c1 = await createTestCriterion();
      const c2 = await createTestCriterion();

      await upsertBeerCriteria({ id_beer: beer.id, id_criterion: c1.id, score: 1 });
      await upsertBeerCriteria({ id_beer: beer.id, id_criterion: c2.id, score: 2 });

      const criteria = await findCriteriaByBeer(beer.id);
      expect(criteria.length).toBe(2);
    });
  });

  it('deleteBeerCriteria removes the entry', async () => {
    await withTestTransaction(async () => {
      const beer = await createTestBeer();
      const criterion = await createTestCriterion();

      await upsertBeerCriteria({ id_beer: beer.id, id_criterion: criterion.id, score: 3 });
      await deleteBeerCriteria(criterion.id, beer.id);

      await expect(findBeerCriteriaEntry(criterion.id, beer.id)).rejects.toMatchObject({
        statusCode: 404,
        code: 'BEER_CRITERIA_NOT_FOUND',
      });
    });
  });
});
