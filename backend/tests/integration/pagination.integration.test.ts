import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import { withTestTransaction } from '../helpers/with-transaction';
import { createTestBeer, createTestUser } from '../helpers/factories';
import { userToken, adminToken } from '../helpers/auth-helpers';

beforeAll(() => {
  process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-jwt-secret';
  process.env.JWT_ACCESS_EXPIRY = '1h';
});

const USER_ID = 1;

describe('Pagination Integration', () => {
  // ─── GET /api/beers ────────────────────────────────────────────────────────

  it('GET /api/beers returns paginated meta + data', async () => {
    await withTestTransaction(async () => {
      await createTestBeer({ name: 'PagBeer1' });
      await createTestBeer({ name: 'PagBeer2' });

      const res = await request(app)
        .get('/api/beers?page=1&limit=2')
        .set('Authorization', `Bearer ${userToken(USER_ID)}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.data)).toBe(true);
      expect(res.body.data.meta).toMatchObject({
        page: 1,
        limit: 2,
        total: expect.any(Number),
        totalPages: expect.any(Number),
      });
    });
  });

  it('GET /api/beers?page=0 retourne 400 (validation)', async () => {
    await withTestTransaction(async () => {
      const res = await request(app)
        .get('/api/beers?page=0')
        .set('Authorization', `Bearer ${userToken(USER_ID)}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  it('GET /api/beers?limit=200 retourne 400 (limite max 100)', async () => {
    await withTestTransaction(async () => {
      const res = await request(app)
        .get('/api/beers?limit=200')
        .set('Authorization', `Bearer ${userToken(USER_ID)}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  it('GET /api/beers?page=999 retourne data vide avec meta total > 0', async () => {
    await withTestTransaction(async () => {
      await createTestBeer({ name: 'PagBeerFarPage' });

      const res = await request(app)
        .get('/api/beers?page=999&limit=20')
        .set('Authorization', `Bearer ${userToken(USER_ID)}`);

      expect(res.status).toBe(200);
      expect(res.body.data.data).toEqual([]);
      expect(res.body.data.meta.total).toBeGreaterThan(0);
    });
  });

  // ─── GET /api/users (admin) ────────────────────────────────────────────────

  it('GET /api/users?page=1&limit=5 retourne pagination (admin)', async () => {
    await withTestTransaction(async () => {
      const res = await request(app)
        .get('/api/users?page=1&limit=5')
        .set('Authorization', `Bearer ${adminToken()}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.meta).toMatchObject({
        page: 1,
        limit: 5,
        total: expect.any(Number),
        totalPages: expect.any(Number),
      });
    });
  });

  it('GET /api/users?page=0 retourne 400 (admin)', async () => {
    await withTestTransaction(async () => {
      const res = await request(app)
        .get('/api/users?page=0')
        .set('Authorization', `Bearer ${adminToken()}`);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  // ─── Structure meta ─────────────────────────────────────────────────────────

  it('la meta contient page, limit, total, totalPages', async () => {
    await withTestTransaction(async () => {
      await createTestBeer({ name: 'MetaBeer' });

      const res = await request(app)
        .get('/api/beers?page=1&limit=10')
        .set('Authorization', `Bearer ${userToken(USER_ID)}`);

      expect(res.body.data.meta).toHaveProperty('page', 1);
      expect(res.body.data.meta).toHaveProperty('limit', 10);
      expect(res.body.data.meta).toHaveProperty('total');
      expect(res.body.data.meta).toHaveProperty('totalPages');
    });
  });

  // ─── GET /api/quizz-sessions (admin) ─────────────────────────────────────

  it('GET /api/quizz-sessions retourne 200 pagine pour admin', async () => {
    await withTestTransaction(async () => {
      const res = await request(app)
        .get('/api/quizz-sessions?page=1&limit=10')
        .set('Authorization', `Bearer ${adminToken()}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.data)).toBe(true);
      expect(res.body.data.meta).toBeDefined();
    });
  });

  it('GET /api/quizz-sessions retourne 403 pour user non admin', async () => {
    await withTestTransaction(async () => {
      const user = await createTestUser();
      const res = await request(app)
        .get('/api/quizz-sessions')
        .set('Authorization', `Bearer ${userToken(user.id)}`);

      expect(res.status).toBe(403);
    });
  });
});
