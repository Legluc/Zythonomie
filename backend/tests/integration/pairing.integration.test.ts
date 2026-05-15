import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import { withTestTransaction } from '../helpers/with-transaction';
import { createTestCategory } from '../helpers/factories';
import prisma from '../../src/lib/prisma';
import { adminToken, userToken } from '../helpers/auth-helpers';

beforeAll(() => {
  process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-jwt-secret';
  process.env.JWT_ACCESS_EXPIRY = '1h';
});

const USER_ID = 1;

describe('Pairing Integration', () => {
  it('GET /api/pairings returns list with ApiResponse format', async () => {
    await withTestTransaction(async () => {
      // Create a test pairing using prisma directly
      await prisma.pairing.create({
        data: {
          name: 'IntegGetPairing',
          description: 'Test pairing',
        },
      });

      const res = await request(app)
        .get('/api/pairings')
        .set('Authorization', `Bearer ${userToken(USER_ID)}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.data)).toBe(true);
      expect(res.body.data.data.some((p: any) => p.name === 'IntegGetPairing')).toBe(true);
    });
  });

  it('GET /api/pairings — 401 without token', async () => {
    await withTestTransaction(async () => {
      const res = await request(app).get('/api/pairings');
      expect(res.status).toBe(401);
    });
  });

  it('POST /api/pairings creates a pairing (ADMIN only)', async () => {
    await withTestTransaction(async () => {
      const res = await request(app)
        .post('/api/pairings')
        .set('Authorization', `Bearer ${adminToken()}`)
        .send({
          name: 'IntegNewPairing',
          description: 'A new integration test pairing',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('IntegNewPairing');
      expect(res.body.data.id).toBeDefined();
    });
  });

  it('POST /api/pairings with categories', async () => {
    await withTestTransaction(async () => {
      const cat1 = await createTestCategory({ name: 'IntegCat1' });
      const cat2 = await createTestCategory({ name: 'IntegCat2' });

      const res = await request(app)
        .post('/api/pairings')
        .set('Authorization', `Bearer ${adminToken()}`)
        .send({
          name: 'IntegPairingWithCats',
          description: 'Pairing with categories',
          category_ids: [cat1.id, cat2.id],
        });

      expect(res.status).toBe(201);
      expect(res.body.data.categories.length).toBe(2);
    });
  });

  it('POST /api/pairings — 403 for USER role', async () => {
    await withTestTransaction(async () => {
      const res = await request(app)
        .post('/api/pairings')
        .set('Authorization', `Bearer ${userToken(USER_ID)}`)
        .send({
          name: 'ShouldFail',
          description: 'Should not be created',
        });

      expect(res.status).toBe(403);
    });
  });

  it('GET /api/pairings/:id returns pairing details', async () => {
    await withTestTransaction(async () => {
      const pairing = await prisma.pairing.create({
        data: {
          name: 'IntegDetailPairing',
          description: 'Test pairing',
        },
      });

      const res = await request(app)
        .get(`/api/pairings/${pairing.id}`)
        .set('Authorization', `Bearer ${userToken(USER_ID)}`);
      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('IntegDetailPairing');
    });
  });

  it('GET /api/pairings/:id — 404 if not found', async () => {
    await withTestTransaction(async () => {
      const res = await request(app)
        .get('/api/pairings/999999')
        .set('Authorization', `Bearer ${userToken(USER_ID)}`);
      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('PAIRING_NOT_FOUND');
    });
  });

  it('PUT /api/pairings/:id updates pairing', async () => {
    await withTestTransaction(async () => {
      const pairing = await prisma.pairing.create({
        data: {
          name: 'IntegOriginalPairing',
          description: 'Original',
        },
      });

      const res = await request(app)
        .put(`/api/pairings/${pairing.id}`)
        .set('Authorization', `Bearer ${adminToken()}`)
        .send({ name: 'IntegUpdatedPairing' });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('IntegUpdatedPairing');
    });
  });

  it('PUT /api/pairings/:id — 403 for USER role', async () => {
    await withTestTransaction(async () => {
      const pairing = await prisma.pairing.create({
        data: {
          name: 'TestPairing',
          description: 'Test',
        },
      });

      const res = await request(app)
        .put(`/api/pairings/${pairing.id}`)
        .set('Authorization', `Bearer ${userToken(USER_ID)}`)
        .send({ name: 'ShouldFail' });

      expect(res.status).toBe(403);
    });
  });

  it('DELETE /api/pairings/:id removes pairing', async () => {
    await withTestTransaction(async () => {
      const pairing = await prisma.pairing.create({
        data: {
          name: 'IntegDeletePairing',
          description: 'To delete',
        },
      });

      const deleteRes = await request(app)
        .delete(`/api/pairings/${pairing.id}`)
        .set('Authorization', `Bearer ${adminToken()}`);
      expect(deleteRes.status).toBe(200);

      const getRes = await request(app)
        .get(`/api/pairings/${pairing.id}`)
        .set('Authorization', `Bearer ${userToken(USER_ID)}`);
      expect(getRes.status).toBe(404);
    });
  });

  it('DELETE /api/pairings/:id — 403 for USER role', async () => {
    await withTestTransaction(async () => {
      const pairing = await prisma.pairing.create({
        data: {
          name: 'TestPairing',
          description: 'Test',
        },
      });

      const res = await request(app)
        .delete(`/api/pairings/${pairing.id}`)
        .set('Authorization', `Bearer ${userToken(USER_ID)}`);
      expect(res.status).toBe(403);
    });
  });
});
