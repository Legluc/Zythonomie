import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import { withTestTransaction } from '../helpers/with-transaction';
import { createTestBeer, createTestCriterion } from '../helpers/factories';
import { adminToken, userToken } from '../helpers/auth-helpers';

beforeAll(() => {
  process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-jwt-secret';
  process.env.JWT_ACCESS_EXPIRY = '1h';
});

const USER_ID = 1;

describe('BeerCriteria Integration', () => {
  it('GET /api/beer-criteria/:id_beer returns criteria list', async () => {
    await withTestTransaction(async () => {
      const beer = await createTestBeer();
      const criterion = await createTestCriterion();

      // Upsert first
      await request(app)
        .put(`/api/beer-criteria/${beer.id}/${criterion.id}`)
        .set('Authorization', `Bearer ${adminToken()}`)
        .send({ score: 3 });

      const res = await request(app)
        .get(`/api/beer-criteria/${beer.id}`)
        .set('Authorization', `Bearer ${userToken(USER_ID)}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  it('GET /api/beer-criteria/:id_beer — 401 without token', async () => {
    await withTestTransaction(async () => {
      const res = await request(app).get('/api/beer-criteria/1');
      expect(res.status).toBe(401);
    });
  });

  it('PUT /api/beer-criteria/:id_beer/:id_criterion upserts score (ADMIN)', async () => {
    await withTestTransaction(async () => {
      const beer = await createTestBeer();
      const criterion = await createTestCriterion();

      const res = await request(app)
        .put(`/api/beer-criteria/${beer.id}/${criterion.id}`)
        .set('Authorization', `Bearer ${adminToken()}`)
        .send({ score: 4 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Number(res.body.data.score)).toBe(4);
    });
  });

  it('PUT /api/beer-criteria/:id_beer/:id_criterion — 403 for USER role', async () => {
    await withTestTransaction(async () => {
      const beer = await createTestBeer();
      const criterion = await createTestCriterion();

      const res = await request(app)
        .put(`/api/beer-criteria/${beer.id}/${criterion.id}`)
        .set('Authorization', `Bearer ${userToken(USER_ID)}`)
        .send({ score: 3 });

      expect(res.status).toBe(403);
    });
  });

  it('PUT /api/beer-criteria/:id_beer/:id_criterion — 422 for invalid score', async () => {
    await withTestTransaction(async () => {
      const beer = await createTestBeer();
      const criterion = await createTestCriterion();

      const res = await request(app)
        .put(`/api/beer-criteria/${beer.id}/${criterion.id}`)
        .set('Authorization', `Bearer ${adminToken()}`)
        .send({ score: 10 });

      expect(res.status).toBe(400);
    });
  });

  it('GET /api/beer-criteria/:id_beer/:id_criterion returns single entry', async () => {
    await withTestTransaction(async () => {
      const beer = await createTestBeer();
      const criterion = await createTestCriterion();

      await request(app)
        .put(`/api/beer-criteria/${beer.id}/${criterion.id}`)
        .set('Authorization', `Bearer ${adminToken()}`)
        .send({ score: 3 });

      const res = await request(app)
        .get(`/api/beer-criteria/${beer.id}/${criterion.id}`)
        .set('Authorization', `Bearer ${userToken(USER_ID)}`);
      expect(res.status).toBe(200);
      expect(Number(res.body.data.score)).toBe(3);
    });
  });

  it('DELETE /api/beer-criteria/:id_beer/:id_criterion removes entry (ADMIN)', async () => {
    await withTestTransaction(async () => {
      const beer = await createTestBeer();
      const criterion = await createTestCriterion();

      await request(app)
        .put(`/api/beer-criteria/${beer.id}/${criterion.id}`)
        .set('Authorization', `Bearer ${adminToken()}`)
        .send({ score: 3 });

      const deleteRes = await request(app)
        .delete(`/api/beer-criteria/${beer.id}/${criterion.id}`)
        .set('Authorization', `Bearer ${adminToken()}`);
      expect(deleteRes.status).toBe(200);

      const getRes = await request(app)
        .get(`/api/beer-criteria/${beer.id}/${criterion.id}`)
        .set('Authorization', `Bearer ${userToken(USER_ID)}`);
      expect(getRes.status).toBe(404);
    });
  });

  it('DELETE /api/beer-criteria/:id_beer/:id_criterion — 403 for USER', async () => {
    await withTestTransaction(async () => {
      const beer = await createTestBeer();
      const criterion = await createTestCriterion();

      await request(app)
        .put(`/api/beer-criteria/${beer.id}/${criterion.id}`)
        .set('Authorization', `Bearer ${adminToken()}`)
        .send({ score: 3 });

      const res = await request(app)
        .delete(`/api/beer-criteria/${beer.id}/${criterion.id}`)
        .set('Authorization', `Bearer ${userToken(USER_ID)}`);
      expect(res.status).toBe(403);
    });
  });
});
