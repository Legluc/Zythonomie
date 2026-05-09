import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import { withTestTransaction } from '../helpers/with-transaction';
import { createTestUser, createTestBeer } from '../helpers/factories';
import { userToken, adminToken } from '../helpers/auth-helpers';

beforeAll(() => {
  process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-jwt-secret';
  process.env.JWT_ACCESS_EXPIRY = '1h';
});

describe('Ratings Integration', () => {
  it('POST /api/ratings creates a rating (201)', async () => {
    await withTestTransaction(async () => {
      const user = await createTestUser();
      const beer = await createTestBeer();

      const res = await request(app)
        .post('/api/ratings')
        .set('Authorization', `Bearer ${userToken(user.id)}`)
        .send({
          id_user: user.id,
          id_beer: beer.id,
          content: 'Excellente bière',
          rate: 5,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.rate).toBe(5);
    });
  });

  it('POST /api/ratings returns 409 for duplicate user-beer', async () => {
    await withTestTransaction(async () => {
      const user = await createTestUser();
      const beer = await createTestBeer();

      await request(app)
        .post('/api/ratings')
        .set('Authorization', `Bearer ${userToken(user.id)}`)
        .send({ id_user: user.id, id_beer: beer.id, content: 'First', rate: 4 });

      const res = await request(app)
        .post('/api/ratings')
        .set('Authorization', `Bearer ${userToken(user.id)}`)
        .send({ id_user: user.id, id_beer: beer.id, content: 'Second', rate: 3 });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('RATING_ALREADY_EXISTS');
    });
  });

  it('DELETE /api/ratings/:id soft-deletes', async () => {
    await withTestTransaction(async () => {
      const user = await createTestUser();
      const beer = await createTestBeer();

      const createRes = await request(app)
        .post('/api/ratings')
        .set('Authorization', `Bearer ${userToken(user.id)}`)
        .send({ id_user: user.id, id_beer: beer.id, content: 'To delete', rate: 3 });

      const ratingId = createRes.body.data.id;

      const deleteRes = await request(app)
        .delete(`/api/ratings/${ratingId}`)
        .set('Authorization', `Bearer ${userToken(user.id)}`);
      expect(deleteRes.status).toBe(200);

      const getRes = await request(app)
        .get(`/api/ratings/beer/${beer.id}`)
        .set('Authorization', `Bearer ${userToken(user.id)}`);
      expect(getRes.body.data.find((r: any) => r.id === ratingId)).toBeUndefined();
    });
  });

  it('GET /api/ratings/beer/:beerId returns ratings', async () => {
    await withTestTransaction(async () => {
      const user = await createTestUser();
      const beer = await createTestBeer();

      await request(app)
        .post('/api/ratings')
        .set('Authorization', `Bearer ${userToken(user.id)}`)
        .send({ id_user: user.id, id_beer: beer.id, content: 'Nice', rate: 4 });

      const res = await request(app)
        .get(`/api/ratings/beer/${beer.id}`)
        .set('Authorization', `Bearer ${userToken(user.id)}`);
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].id_beer).toBe(beer.id);
    });
  });
});
