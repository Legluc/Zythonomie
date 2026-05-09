import { describe, it, expect } from 'vitest';
import { withTestTransaction } from '../helpers/with-transaction';
import { createTestBeer } from '../helpers/factories';
import prisma from '../../src/lib/prisma';
import { paginate } from '../../src/lib/paginate';

describe('paginate helper', () => {
  it('returns correct data and meta structure', async () => {
    await withTestTransaction(async () => {
      await createTestBeer({ name: 'PaginateBeer1' });
      await createTestBeer({ name: 'PaginateBeer2' });
      await createTestBeer({ name: 'PaginateBeer3' });

      const result = await paginate(
        prisma.beer,
        { where: { deleted_at: null }, select: { id: true, name: true } },
        1,
        10,
      );

      expect(Array.isArray(result.data)).toBe(true);
      expect(result.meta).toBeDefined();
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(10);
      expect(typeof result.meta.total).toBe('number');
      expect(typeof result.meta.totalPages).toBe('number');
      expect(result.meta.total).toBeGreaterThanOrEqual(3);
    });
  });

  it('respects skip and take (page=2, limit=1)', async () => {
    await withTestTransaction(async () => {
      // Creer 3 bieres ordonnees par nom
      await createTestBeer({ name: 'AlfaBeer' });
      await createTestBeer({ name: 'BetaBeer' });
      await createTestBeer({ name: 'GammaBeer' });

      const page1 = await paginate(
        prisma.beer,
        { where: { deleted_at: null }, select: { id: true, name: true }, orderBy: { name: 'asc' } },
        1,
        1,
      );
      const page2 = await paginate(
        prisma.beer,
        { where: { deleted_at: null }, select: { id: true, name: true }, orderBy: { name: 'asc' } },
        2,
        1,
      );

      expect(page1.data.length).toBe(1);
      expect(page2.data.length).toBe(1);
      // Les deux pages doivent retourner des elements differents
      const ids1 = page1.data.map((b: any) => b.id);
      const ids2 = page2.data.map((b: any) => b.id);
      expect(ids1[0]).not.toBe(ids2[0]);
    });
  });

  it('calcule totalPages correctement', async () => {
    await withTestTransaction(async () => {
      await createTestBeer({ name: 'TpBeer1' });
      await createTestBeer({ name: 'TpBeer2' });
      await createTestBeer({ name: 'TpBeer3' });

      const result = await paginate(
        prisma.beer,
        { where: { name: { in: ['TpBeer1', 'TpBeer2', 'TpBeer3'] } } },
        1,
        2,
      );

      expect(result.meta.total).toBe(3);
      expect(result.meta.totalPages).toBe(2);
    });
  });

  it('retourne data vide pour page au-dela du total', async () => {
    await withTestTransaction(async () => {
      await createTestBeer({ name: 'BeyondBeer' });

      const result = await paginate(
        prisma.beer,
        { where: { name: 'BeyondBeer' }, select: { id: true } },
        999,
        20,
      );

      expect(result.data).toEqual([]);
      expect(result.meta.total).toBe(1);
    });
  });

  it('totalPages = 0 quand total = 0', async () => {
    await withTestTransaction(async () => {
      const result = await paginate(
        prisma.beer,
        { where: { name: '__nom_qui_nexiste_pas__' } },
        1,
        20,
      );

      expect(result.meta.total).toBe(0);
      expect(result.meta.totalPages).toBe(0);
      expect(result.data).toEqual([]);
    });
  });
});
