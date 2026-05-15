import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import { withTestTransaction } from '../helpers/with-transaction';
import { createTestUser } from '../helpers/factories';
import { adminToken, userToken } from '../helpers/auth-helpers';

beforeAll(() => {
  process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-jwt-secret';
  process.env.JWT_ACCESS_EXPIRY = '1h';
});

describe('User Integration', () => {
  it('GET /api/users returns list (ADMIN only)', async () => {
    await withTestTransaction(async () => {
      await createTestUser({ name: 'TestUser' });

      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken()}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.data)).toBe(true);
      expect(res.body.data.data.some((u: any) => u.name === 'TestUser')).toBe(true);
    });
  });

  it('GET /api/users — 403 for USER role', async () => {
    await withTestTransaction(async () => {
      const user = await createTestUser();

      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${userToken(user.id)}`);
      expect(res.status).toBe(403);
    });
  });

  it('GET /api/users — 401 without token', async () => {
    await withTestTransaction(async () => {
      const res = await request(app).get('/api/users');
      expect(res.status).toBe(401);
    });
  });

  it('POST /api/users creates user (ADMIN only)', async () => {
    await withTestTransaction(async () => {
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken()}`)
        .send({
          name: 'NewUser',
          firstname: 'John',
          mail: 'john@example.com',
          password: 'securePassword123',
          birthday: '1990-01-01',
          adress: '123 Test Street',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('NewUser');
      expect(res.body.data.id).toBeDefined();
    });
  });

  it('POST /api/users — 403 for USER role', async () => {
    await withTestTransaction(async () => {
      const user = await createTestUser();

      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${userToken(user.id)}`)
        .send({
          name: 'ShouldFail',
          firstname: 'John',
          mail: 'fail@example.com',
          password: 'securePassword123',
          birthday: '1990-01-01',
          adress: '123 Test Street',
        });

      expect(res.status).toBe(403);
    });
  });

  it('GET /api/users/:id returns user details (owner or admin)', async () => {
    await withTestTransaction(async () => {
      const user = await createTestUser({ name: 'DetailUser' });

      const res = await request(app)
        .get(`/api/users/${user.id}`)
        .set('Authorization', `Bearer ${userToken(user.id)}`);
      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('DetailUser');
    });
  });

  it('GET /api/users/:id — 403 for other USER', async () => {
    await withTestTransaction(async () => {
      const user1 = await createTestUser({ name: 'User1' });
      const user2 = await createTestUser({ name: 'User2' });

      const res = await request(app)
        .get(`/api/users/${user1.id}`)
        .set('Authorization', `Bearer ${userToken(user2.id)}`);
      expect(res.status).toBe(403);
    });
  });

  it('GET /api/users/:id — 403 for other user (IDOR check before 404)', async () => {
    await withTestTransaction(async () => {
      const user = await createTestUser();

      // requireOwnerOrAdmin middleware blocks access to other users before checking if exists
      const res = await request(app)
        .get('/api/users/999999')
        .set('Authorization', `Bearer ${userToken(user.id)}`);
      expect(res.status).toBe(403);
    });
  });

  it('PUT /api/users/:id updates user (owner or admin)', async () => {
    await withTestTransaction(async () => {
      const user = await createTestUser();

      const res = await request(app)
        .put(`/api/users/${user.id}`)
        .set('Authorization', `Bearer ${userToken(user.id)}`)
        .send({ name: 'UpdatedName' });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('UpdatedName');
    });
  });

  it('PUT /api/users/:id — cannot set role via API (validation error)', async () => {
    await withTestTransaction(async () => {
      const user = await createTestUser();

      // Zod validation rejects role field with 400 bad request
      const res = await request(app)
        .put(`/api/users/${user.id}`)
        .set('Authorization', `Bearer ${userToken(user.id)}`)
        .send({ role: 'ADMIN' });

      expect(res.status).toBe(400);
    });
  });

  it('PUT /api/users/:id — 403 for other USER', async () => {
    await withTestTransaction(async () => {
      const user1 = await createTestUser({ name: 'User1' });
      const user2 = await createTestUser({ name: 'User2' });

      const res = await request(app)
        .put(`/api/users/${user1.id}`)
        .set('Authorization', `Bearer ${userToken(user2.id)}`)
        .send({ name: 'ShouldFail' });

      expect(res.status).toBe(403);
    });
  });

  it('DELETE /api/users/:id soft-deletes user (owner or admin)', async () => {
    await withTestTransaction(async () => {
      const user = await createTestUser();

      const deleteRes = await request(app)
        .delete(`/api/users/${user.id}`)
        .set('Authorization', `Bearer ${userToken(user.id)}`);
      expect(deleteRes.status).toBe(200);

      // Verify soft delete — user should not be in list anymore
      const listRes = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken()}`);
      expect(listRes.body.data.data.some((u: any) => u.id === user.id)).toBe(false);
    });
  });

  it('DELETE /api/users/:id soft-deletes and anonymizes email', async () => {
    await withTestTransaction(async () => {
      const user = await createTestUser();
      const originalEmail = user.mail;

      await request(app)
        .delete(`/api/users/${user.id}`)
        .set('Authorization', `Bearer ${userToken(user.id)}`);

      // Try to login with old credentials - should fail
      const loginRes = await request(app).post('/api/auth/login').send({
        mail: originalEmail,
        password: 'testpassword',
      });
      expect(loginRes.status).toBe(401);
    });
  });

  it('DELETE /api/users/:id — 403 for other USER', async () => {
    await withTestTransaction(async () => {
      const user1 = await createTestUser({ name: 'User1' });
      const user2 = await createTestUser({ name: 'User2' });

      const res = await request(app)
        .delete(`/api/users/${user1.id}`)
        .set('Authorization', `Bearer ${userToken(user2.id)}`);
      expect(res.status).toBe(403);
    });
  });

  it('ADMIN can update and delete any user', async () => {
    await withTestTransaction(async () => {
      const user = await createTestUser();

      const updateRes = await request(app)
        .put(`/api/users/${user.id}`)
        .set('Authorization', `Bearer ${adminToken()}`)
        .send({ name: 'AdminUpdated' });
      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.name).toBe('AdminUpdated');

      const deleteRes = await request(app)
        .delete(`/api/users/${user.id}`)
        .set('Authorization', `Bearer ${adminToken()}`);
      expect(deleteRes.status).toBe(200);
    });
  });
});
