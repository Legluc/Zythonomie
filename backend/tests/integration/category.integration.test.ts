import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import { withTestTransaction } from '../helpers/with-transaction';
import { createTestCategory } from '../helpers/factories';
import { adminToken, userToken } from '../helpers/auth-helpers';

beforeAll(() => {
  process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-jwt-secret';
  process.env.JWT_ACCESS_EXPIRY = '1h';
});

const USER_ID = 1;

describe('Category Integration', () => {
  it('GET /api/categories returns list with ApiResponse format', async () => {
    await withTestTransaction(async () => {
      await createTestCategory({ name: 'IntegGetCategory' });

      const res = await request(app)
        .get('/api/categories')
        .set('Authorization', `Bearer ${userToken(USER_ID)}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.data)).toBe(true);
      expect(res.body.data.data.some((c: any) => c.name === 'IntegGetCategory')).toBe(true);
    });
  });

  it('GET /api/categories — 401 without token', async () => {
    await withTestTransaction(async () => {
      const res = await request(app).get('/api/categories');
      expect(res.status).toBe(401);
    });
  });

  it('POST /api/categories creates a category (ADMIN only)', async () => {
    await withTestTransaction(async () => {
      const res = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${adminToken()}`)
        .send({
          name: 'IntegNewCategory',
          description: 'A new integration test category',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('IntegNewCategory');
      expect(res.body.data.id).toBeDefined();
    });
  });

  it('POST /api/categories with parent category', async () => {
    await withTestTransaction(async () => {
      const parent = await createTestCategory({ name: 'IntegParentCategory' });

      const res = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${adminToken()}`)
        .send({
          name: 'IntegChildCategory',
          description: 'A child category',
          id_parent_category: parent.id,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.id_parent_category).toBe(parent.id);
    });
  });

  it('POST /api/categories — 403 for USER role', async () => {
    await withTestTransaction(async () => {
      const res = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${userToken(USER_ID)}`)
        .send({
          name: 'ShouldFail',
          description: 'Should not be created',
        });

      expect(res.status).toBe(403);
    });
  });

  it('GET /api/categories/:id returns category details', async () => {
    await withTestTransaction(async () => {
      const category = await createTestCategory({ name: 'IntegDetailCategory' });

      const res = await request(app)
        .get(`/api/categories/${category.id}`)
        .set('Authorization', `Bearer ${userToken(USER_ID)}`);
      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('IntegDetailCategory');
    });
  });

  it('GET /api/categories/:id — 404 if not found', async () => {
    await withTestTransaction(async () => {
      const res = await request(app)
        .get('/api/categories/999999')
        .set('Authorization', `Bearer ${userToken(USER_ID)}`);
      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('CATEGORY_NOT_FOUND');
    });
  });

  it('PUT /api/categories/:id updates category', async () => {
    await withTestTransaction(async () => {
      const category = await createTestCategory();

      const res = await request(app)
        .put(`/api/categories/${category.id}`)
        .set('Authorization', `Bearer ${adminToken()}`)
        .send({ name: 'IntegUpdatedCategory' });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('IntegUpdatedCategory');
    });
  });

  it('PUT /api/categories/:id — 403 for USER role', async () => {
    await withTestTransaction(async () => {
      const category = await createTestCategory();

      const res = await request(app)
        .put(`/api/categories/${category.id}`)
        .set('Authorization', `Bearer ${userToken(USER_ID)}`)
        .send({ name: 'ShouldFail' });

      expect(res.status).toBe(403);
    });
  });

  it('DELETE /api/categories/:id removes category', async () => {
    await withTestTransaction(async () => {
      const category = await createTestCategory();

      const deleteRes = await request(app)
        .delete(`/api/categories/${category.id}`)
        .set('Authorization', `Bearer ${adminToken()}`);
      expect(deleteRes.status).toBe(200);

      const getRes = await request(app)
        .get(`/api/categories/${category.id}`)
        .set('Authorization', `Bearer ${userToken(USER_ID)}`);
      expect(getRes.status).toBe(404);
    });
  });

  it('DELETE /api/categories/:id — 403 for USER role', async () => {
    await withTestTransaction(async () => {
      const category = await createTestCategory();

      const res = await request(app)
        .delete(`/api/categories/${category.id}`)
        .set('Authorization', `Bearer ${userToken(USER_ID)}`);
      expect(res.status).toBe(403);
    });
  });
});
