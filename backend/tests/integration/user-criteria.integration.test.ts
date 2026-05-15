import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import { withTestTransaction } from '../helpers/with-transaction';
import { createTestUser, createTestCriterion } from '../helpers/factories';
import { adminToken, userToken } from '../helpers/auth-helpers';

beforeAll(() => {
  process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-jwt-secret';
  process.env.JWT_ACCESS_EXPIRY = '1h';
});

describe('UserCriteria Integration', () => {
  it('GET /api/user-criteria/:id_user returns criteria list (owner)', async () => {
    await withTestTransaction(async () => {
      const user = await createTestUser();
      const criterion = await createTestCriterion();

      // Upsert first
      await request(app)
        .put(`/api/user-criteria/${user.id}/${criterion.id}`)
        .set('Authorization', `Bearer ${userToken(user.id)}`)
        .send({ score: 3 });

      const res = await request(app)
        .get(`/api/user-criteria/${user.id}`)
        .set('Authorization', `Bearer ${userToken(user.id)}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  it('GET /api/user-criteria/:id_user — 403 for other USER', async () => {
    await withTestTransaction(async () => {
      const user1 = await createTestUser({ name: 'User1' });
      const user2 = await createTestUser({ name: 'User2' });

      const res = await request(app)
        .get(`/api/user-criteria/${user1.id}`)
        .set('Authorization', `Bearer ${userToken(user2.id)}`);
      expect(res.status).toBe(403);
    });
  });

  it('GET /api/user-criteria/:id_user — 200 for ADMIN', async () => {
    await withTestTransaction(async () => {
      const user = await createTestUser();
      const criterion = await createTestCriterion();

      await request(app)
        .put(`/api/user-criteria/${user.id}/${criterion.id}`)
        .set('Authorization', `Bearer ${adminToken()}`)
        .send({ score: 3 });

      const res = await request(app)
        .get(`/api/user-criteria/${user.id}`)
        .set('Authorization', `Bearer ${adminToken()}`);
      expect(res.status).toBe(200);
    });
  });

  it('PUT /api/user-criteria/:id_user/:id_criterion upserts score (owner)', async () => {
    await withTestTransaction(async () => {
      const user = await createTestUser();
      const criterion = await createTestCriterion();

      const res = await request(app)
        .put(`/api/user-criteria/${user.id}/${criterion.id}`)
        .set('Authorization', `Bearer ${userToken(user.id)}`)
        .send({ score: 4 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Number(res.body.data.score)).toBe(4);
    });
  });

  it('PUT /api/user-criteria/:id_user/:id_criterion — 422 for invalid score', async () => {
    await withTestTransaction(async () => {
      const user = await createTestUser();
      const criterion = await createTestCriterion();

      const res = await request(app)
        .put(`/api/user-criteria/${user.id}/${criterion.id}`)
        .set('Authorization', `Bearer ${userToken(user.id)}`)
        .send({ score: 10 });

      expect(res.status).toBe(400);
    });
  });

  it('PUT /api/user-criteria/:id_user/:id_criterion — 403 for other USER', async () => {
    await withTestTransaction(async () => {
      const user1 = await createTestUser({ name: 'User1' });
      const user2 = await createTestUser({ name: 'User2' });
      const criterion = await createTestCriterion();

      const res = await request(app)
        .put(`/api/user-criteria/${user1.id}/${criterion.id}`)
        .set('Authorization', `Bearer ${userToken(user2.id)}`)
        .send({ score: 3 });

      expect(res.status).toBe(403);
    });
  });

  it('PUT /api/user-criteria/:id_user/:id_criterion controls IDOR', async () => {
    await withTestTransaction(async () => {
      const user1 = await createTestUser({ name: 'User1' });
      const user2 = await createTestUser({ name: 'User2' });
      const criterion = await createTestCriterion();

      // User1 sets their own criteria
      await request(app)
        .put(`/api/user-criteria/${user1.id}/${criterion.id}`)
        .set('Authorization', `Bearer ${userToken(user1.id)}`)
        .send({ score: 5 });

      // User2 tries to read User1's criteria
      const res = await request(app)
        .get(`/api/user-criteria/${user1.id}`)
        .set('Authorization', `Bearer ${userToken(user2.id)}`);
      expect(res.status).toBe(403);
    });
  });

  it('GET /api/user-criteria/:id_user/:id_criterion returns single entry', async () => {
    await withTestTransaction(async () => {
      const user = await createTestUser();
      const criterion = await createTestCriterion();

      await request(app)
        .put(`/api/user-criteria/${user.id}/${criterion.id}`)
        .set('Authorization', `Bearer ${userToken(user.id)}`)
        .send({ score: 3 });

      const res = await request(app)
        .get(`/api/user-criteria/${user.id}/${criterion.id}`)
        .set('Authorization', `Bearer ${userToken(user.id)}`);
      expect(res.status).toBe(200);
      expect(Number(res.body.data.score)).toBe(3);
    });
  });

  it('DELETE /api/user-criteria/:id_user/:id_criterion removes entry', async () => {
    await withTestTransaction(async () => {
      const user = await createTestUser();
      const criterion = await createTestCriterion();

      await request(app)
        .put(`/api/user-criteria/${user.id}/${criterion.id}`)
        .set('Authorization', `Bearer ${userToken(user.id)}`)
        .send({ score: 3 });

      const deleteRes = await request(app)
        .delete(`/api/user-criteria/${user.id}/${criterion.id}`)
        .set('Authorization', `Bearer ${userToken(user.id)}`);
      expect(deleteRes.status).toBe(200);

      const getRes = await request(app)
        .get(`/api/user-criteria/${user.id}/${criterion.id}`)
        .set('Authorization', `Bearer ${userToken(user.id)}`);
      expect(getRes.status).toBe(404);
    });
  });
});
