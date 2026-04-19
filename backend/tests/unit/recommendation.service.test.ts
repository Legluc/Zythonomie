import { describe, it, expect } from 'vitest';
import { withTestTransaction } from '../helpers/with-transaction';
import { createTestUser, createTestBeer, createTestCriterion } from '../helpers/factories';
import prisma from '../../src/lib/prisma';
import {
  refreshRecommendationsForUser,
  getRecommendationsForUser,
} from '../../src/services/recommendation.service';

describe('recommendation.service', () => {
  it('calculates correct dot product on known example', async () => {
    await withTestTransaction(async () => {
      const user = await createTestUser();
      const c1 = await createTestCriterion();
      const c2 = await createTestCriterion();

      // User scores: c1=4, c2=2
      await prisma.userCriteria.create({ data: { id_user: user.id, id_criterion: c1.id, score: 4 } });
      await prisma.userCriteria.create({ data: { id_user: user.id, id_criterion: c2.id, score: 2 } });

      const beer = await createTestBeer();
      // Beer scores: c1=3, c2=5
      await prisma.beerCriteria.create({ data: { id_beer: beer.id, id_criterion: c1.id, score: 3 } });
      await prisma.beerCriteria.create({ data: { id_beer: beer.id, id_criterion: c2.id, score: 5 } });

      // Expected: (4*3 + 2*5) / 2 = 22 / 2 = 11
      const recs = await refreshRecommendationsForUser(user.id);
      const rec = recs.find((r) => r.id_beer === beer.id);
      expect(rec).toBeDefined();
      expect(Number(rec!.score_compatibility)).toBeCloseTo(11);
    });
  });

  it('normalizes by number of common criteria', async () => {
    await withTestTransaction(async () => {
      const user = await createTestUser();
      const c1 = await createTestCriterion();

      await prisma.userCriteria.create({ data: { id_user: user.id, id_criterion: c1.id, score: 5 } });

      const beer = await createTestBeer();
      await prisma.beerCriteria.create({ data: { id_beer: beer.id, id_criterion: c1.id, score: 3 } });

      // Expected: (5*3) / 1 = 15
      const recs = await refreshRecommendationsForUser(user.id);
      const rec = recs.find((r) => r.id_beer === beer.id);
      expect(rec).toBeDefined();
      expect(Number(rec!.score_compatibility)).toBeCloseTo(15);
    });
  });

  it('excludes beers with no common criteria', async () => {
    await withTestTransaction(async () => {
      const user = await createTestUser();
      const c1 = await createTestCriterion();
      const c2 = await createTestCriterion();

      // User has c1 only
      await prisma.userCriteria.create({ data: { id_user: user.id, id_criterion: c1.id, score: 3 } });

      // Beer1 has c1 (common)
      const beer1 = await createTestBeer();
      await prisma.beerCriteria.create({ data: { id_beer: beer1.id, id_criterion: c1.id, score: 4 } });

      // Beer2 has c2 only (no common criteria with user)
      const beer2 = await createTestBeer();
      await prisma.beerCriteria.create({ data: { id_beer: beer2.id, id_criterion: c2.id, score: 5 } });

      const recs = await refreshRecommendationsForUser(user.id);
      const beerIds = recs.map((r) => r.id_beer);
      expect(beerIds).toContain(beer1.id);
      expect(beerIds).not.toContain(beer2.id);
    });
  });

  it('excludes soft-deleted beers', async () => {
    await withTestTransaction(async () => {
      const user = await createTestUser();
      const c1 = await createTestCriterion();

      await prisma.userCriteria.create({ data: { id_user: user.id, id_criterion: c1.id, score: 3 } });

      const beer = await createTestBeer();
      await prisma.beerCriteria.create({ data: { id_beer: beer.id, id_criterion: c1.id, score: 4 } });

      // Soft-delete the beer
      await prisma.beer.update({ where: { id: beer.id }, data: { deleted_at: new Date() } });

      const recs = await refreshRecommendationsForUser(user.id);
      const beerIds = recs.map((r) => r.id_beer);
      expect(beerIds).not.toContain(beer.id);
    });
  });

  it('returns empty for user without criteria', async () => {
    await withTestTransaction(async () => {
      const user = await createTestUser();
      const recs = await refreshRecommendationsForUser(user.id);
      expect(recs).toEqual([]);
    });
  });

  it('throws 404 for non-existent user', async () => {
    await withTestTransaction(async () => {
      await expect(refreshRecommendationsForUser(999999)).rejects.toMatchObject({
        statusCode: 404,
        code: 'USER_NOT_FOUND',
      });
    });
  });

  it('getRecommendationsForUser returns persisted data after refresh', async () => {
    await withTestTransaction(async () => {
      const user = await createTestUser();
      const c1 = await createTestCriterion();

      await prisma.userCriteria.create({ data: { id_user: user.id, id_criterion: c1.id, score: 4 } });
      const beer = await createTestBeer();
      await prisma.beerCriteria.create({ data: { id_beer: beer.id, id_criterion: c1.id, score: 3 } });

      await refreshRecommendationsForUser(user.id);

      const recs = await getRecommendationsForUser(user.id);
      expect(recs.length).toBeGreaterThan(0);
      const rec = recs.find((r) => r.id_beer === beer.id);
      expect(rec).toBeDefined();
    });
  });

  it('double refresh is idempotent', async () => {
    await withTestTransaction(async () => {
      const user = await createTestUser();
      const c1 = await createTestCriterion();

      await prisma.userCriteria.create({ data: { id_user: user.id, id_criterion: c1.id, score: 4 } });
      const beer = await createTestBeer();
      await prisma.beerCriteria.create({ data: { id_beer: beer.id, id_criterion: c1.id, score: 3 } });

      const first = await refreshRecommendationsForUser(user.id);
      const second = await refreshRecommendationsForUser(user.id);

      const firstRec = first.find((r) => r.id_beer === beer.id);
      const secondRec = second.find((r) => r.id_beer === beer.id);
      expect(firstRec).toBeDefined();
      expect(secondRec).toBeDefined();
      expect(Number(firstRec!.score_compatibility)).toBe(Number(secondRec!.score_compatibility));
    });
  });
});
