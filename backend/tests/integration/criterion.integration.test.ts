import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import { withTestTransaction } from '../helpers/with-transaction';
import { createTestCriterion } from '../helpers/factories';
import { userToken, adminToken } from '../helpers/auth-helpers';

const USER_ID = 1;

beforeAll(() => {
  process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-jwt-secret';
  process.env.JWT_ACCESS_EXPIRY = '1h';
});

describe('Criterion Integration', () => {
  it('GET /api/criteria returns list (authenticated)', async () => {
    await withTestTransaction(async () => {
      await createTestCriterion({ name: 'crit_get_all' });

      const res = await request(app)
        .get('/api/criteria')
        .set('Authorization', `Bearer ${userToken(USER_ID)}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.some((c: any) => c.name === 'crit_get_all')).toBe(true);
    });
  });

  it('GET /api/criteria — 401 without token', async () => {
    const res = await request(app).get('/api/criteria');
    expect(res.status).toBe(401);
  });

  it('GET /api/criteria/:id returns criterion', async () => {
    await withTestTransaction(async () => {
      const criterion = await createTestCriterion();

      const res = await request(app)
        .get(`/api/criteria/${criterion.id}`)
        .set('Authorization', `Bearer ${userToken(USER_ID)}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(criterion.id);
      expect(res.body.data.name).toBe(criterion.name);
    });
  });

  it('GET /api/criteria/:id — 404 if not found', async () => {
    await withTestTransaction(async () => {
      const res = await request(app)
        .get('/api/criteria/999999')
        .set('Authorization', `Bearer ${userToken(USER_ID)}`);

      expect(res.status).toBe(404);
    });
  });

  it('POST /api/criteria creates criterion (ADMIN)', async () => {
    await withTestTransaction(async () => {
      const res = await request(app)
        .post('/api/criteria')
        .set('Authorization', `Bearer ${adminToken()}`)
        .send({ name: 'amertume', description: 'Niveau d\'amertume' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('amertume');
    });
  });

  it('POST /api/criteria — 403 for USER role', async () => {
    await withTestTransaction(async () => {
      const res = await request(app)
        .post('/api/criteria')
        .set('Authorization', `Bearer ${userToken(USER_ID)}`)
        .send({ name: 'acidite', description: 'Niveau d\'acidité' });

      expect(res.status).toBe(403);
    });
  });

  it('PATCH /api/criteria/:id updates criterion (ADMIN)', async () => {
    await withTestTransaction(async () => {
      const criterion = await createTestCriterion();

      const res = await request(app)
        .patch(`/api/criteria/${criterion.id}`)
        .set('Authorization', `Bearer ${adminToken()}`)
        .send({ description: 'Description mise à jour' });

      expect(res.status).toBe(200);
      expect(res.body.data.description).toBe('Description mise à jour');
    });
  });

  it('PATCH /api/criteria/:id — 403 for USER role', async () => {
    await withTestTransaction(async () => {
      const criterion = await createTestCriterion();

      const res = await request(app)
        .patch(`/api/criteria/${criterion.id}`)
        .set('Authorization', `Bearer ${userToken(USER_ID)}`)
        .send({ description: 'Tentative' });

      expect(res.status).toBe(403);
    });
  });

  it('DELETE /api/criteria/:id removes criterion (ADMIN)', async () => {
    await withTestTransaction(async () => {
      const criterion = await createTestCriterion();

      const res = await request(app)
        .delete(`/api/criteria/${criterion.id}`)
        .set('Authorization', `Bearer ${adminToken()}`);

      expect(res.status).toBe(200);
      expect(res.body.data.deleted).toBe(true);

      const getRes = await request(app)
        .get(`/api/criteria/${criterion.id}`)
        .set('Authorization', `Bearer ${userToken(USER_ID)}`);
      expect(getRes.status).toBe(404);
    });
  });

  it('DELETE /api/criteria/:id — 403 for USER role', async () => {
    await withTestTransaction(async () => {
      const criterion = await createTestCriterion();

      const res = await request(app)
        .delete(`/api/criteria/${criterion.id}`)
        .set('Authorization', `Bearer ${userToken(USER_ID)}`);

      expect(res.status).toBe(403);
    });
  });
});
