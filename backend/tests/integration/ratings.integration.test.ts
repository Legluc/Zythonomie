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
      expect(getRes.body.data.data.find((r: any) => r.id === ratingId)).toBeUndefined();
    });
  });

  it('DELETE /api/ratings/:id — 403 if other user tries to delete', async () => {
    await withTestTransaction(async () => {
      const user1 = await createTestUser({ name: 'User1' });
      const user2 = await createTestUser({ name: 'User2' });
      const beer = await createTestBeer();

      const createRes = await request(app)
        .post('/api/ratings')
        .set('Authorization', `Bearer ${userToken(user1.id)}`)
        .send({ id_user: user1.id, id_beer: beer.id, content: 'User1 rating', rate: 4 });

      const ratingId = createRes.body.data.id;

      // User2 tries to delete User1's rating
      const res = await request(app)
        .delete(`/api/ratings/${ratingId}`)
        .set('Authorization', `Bearer ${userToken(user2.id)}`);
      expect(res.status).toBe(403);
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
      expect(res.body.data.data.length).toBe(1);
      expect(res.body.data.data[0].id_beer).toBe(beer.id);
    });
  });

  it('GET /api/ratings/user/:userId returns user ratings', async () => {
    await withTestTransaction(async () => {
      const user = await createTestUser();
      const beer = await createTestBeer();

      await request(app)
        .post('/api/ratings')
        .set('Authorization', `Bearer ${userToken(user.id)}`)
        .send({ id_user: user.id, id_beer: beer.id, content: 'Ma bière', rate: 3 });

      const res = await request(app)
        .get(`/api/ratings/user/${user.id}`)
        .set('Authorization', `Bearer ${userToken(user.id)}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.data.length).toBe(1);
      expect(res.body.data.data[0].id_user).toBe(user.id);
    });
  });

  it('PUT /api/ratings/:id updates content and rate (owner)', async () => {
    await withTestTransaction(async () => {
      const user = await createTestUser();
      const beer = await createTestBeer();

      const createRes = await request(app)
        .post('/api/ratings')
        .set('Authorization', `Bearer ${userToken(user.id)}`)
        .send({ id_user: user.id, id_beer: beer.id, content: 'Original', rate: 2 });

      const ratingId = createRes.body.data.id;

      const updateRes = await request(app)
        .put(`/api/ratings/${ratingId}`)
        .set('Authorization', `Bearer ${userToken(user.id)}`)
        .send({ content: 'Mise à jour', rate: 5 });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.content).toBe('Mise à jour');
      expect(updateRes.body.data.rate).toBe(5);
    });
  });
});
