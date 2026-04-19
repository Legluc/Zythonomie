import { describe, it, expect } from 'vitest';
import { withTestTransaction } from '../helpers/with-transaction';
import { createTestUser, createTestBeer } from '../helpers/factories';
import {
  createRating,
  findRatingsByBeer,
  updateRating,
  softDeleteRating,
} from '../../src/services/rating.service';

describe('rating.service', () => {
  it('createRating creates a rating', async () => {
    await withTestTransaction(async () => {
      const user = await createTestUser();
      const beer = await createTestBeer();

      const rating = await createRating({
        id_user: user.id,
        id_beer: beer.id,
        content: 'Très bonne bière',
        rate: 4,
      });

      expect(rating.id_user).toBe(user.id);
      expect(rating.id_beer).toBe(beer.id);
      expect(rating.rate).toBe(4);
      expect(rating.content).toBe('Très bonne bière');
    });
  });

  it('createRating throws 409 for duplicate user-beer', async () => {
    await withTestTransaction(async () => {
      const user = await createTestUser();
      const beer = await createTestBeer();

      await createRating({ id_user: user.id, id_beer: beer.id, content: 'First', rate: 3 });

      await expect(
        createRating({ id_user: user.id, id_beer: beer.id, content: 'Second', rate: 5 }),
      ).rejects.toMatchObject({ statusCode: 409, code: 'RATING_ALREADY_EXISTS' });
    });
  });

  it('findRatingsByBeer returns ratings for a beer', async () => {
    await withTestTransaction(async () => {
      const user = await createTestUser();
      const beer = await createTestBeer();

      await createRating({ id_user: user.id, id_beer: beer.id, content: 'Good', rate: 4 });

      const ratings = await findRatingsByBeer(beer.id);
      expect(ratings.length).toBe(1);
      expect(ratings[0].id_beer).toBe(beer.id);
    });
  });

  it('updateRating updates the rating', async () => {
    await withTestTransaction(async () => {
      const user = await createTestUser();
      const beer = await createTestBeer();

      const rating = await createRating({ id_user: user.id, id_beer: beer.id, content: 'Ok', rate: 3 });
      const updated = await updateRating(rating.id, { rate: 5, content: 'Superbe' });

      expect(updated.rate).toBe(5);
      expect(updated.content).toBe('Superbe');
    });
  });

  it('softDeleteRating soft-deletes the rating', async () => {
    await withTestTransaction(async () => {
      const user = await createTestUser();
      const beer = await createTestBeer();

      const rating = await createRating({ id_user: user.id, id_beer: beer.id, content: 'Ok', rate: 3 });
      await softDeleteRating(rating.id);

      const ratings = await findRatingsByBeer(beer.id);
      expect(ratings.find((r) => r.id === rating.id)).toBeUndefined();
    });
  });

  it('createRating throws 404 for non-existent user', async () => {
    await withTestTransaction(async () => {
      const beer = await createTestBeer();

      await expect(
        createRating({ id_user: 999999, id_beer: beer.id, content: 'Test', rate: 3 }),
      ).rejects.toMatchObject({ statusCode: 404, code: 'USER_NOT_FOUND' });
    });
  });

  it('createRating throws 404 for non-existent beer', async () => {
    await withTestTransaction(async () => {
      const user = await createTestUser();

      await expect(
        createRating({ id_user: user.id, id_beer: 999999, content: 'Test', rate: 3 }),
      ).rejects.toMatchObject({ statusCode: 404, code: 'BEER_NOT_FOUND' });
    });
  });
});
