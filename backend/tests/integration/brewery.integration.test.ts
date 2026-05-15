import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import { withTestTransaction } from '../helpers/with-transaction';
import { createTestBrewery } from '../helpers/factories';
import { adminToken, userToken } from '../helpers/auth-helpers';

beforeAll(() => {
  process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-jwt-secret';
  process.env.JWT_ACCESS_EXPIRY = '1h';
});

const USER_ID = 1;

describe('Brewery Integration', () => {
  it('GET /api/breweries returns list with ApiResponse format', async () => {
    await withTestTransaction(async () => {
      await createTestBrewery({ name: 'IntegGetBrewery' });

      const res = await request(app)
        .get('/api/breweries')
        .set('Authorization', `Bearer ${userToken(USER_ID)}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.data)).toBe(true);
      expect(res.body.data.data.some((b: any) => b.name === 'IntegGetBrewery')).toBe(true);
    });
  });

  it('GET /api/breweries — 401 without token', async () => {
    await withTestTransaction(async () => {
      const res = await request(app).get('/api/breweries');
      expect(res.status).toBe(401);
    });
  });

  it('POST /api/breweries creates a brewery (ADMIN only)', async () => {
    await withTestTransaction(async () => {
      const res = await request(app)
        .post('/api/breweries')
        .set('Authorization', `Bearer ${adminToken()}`)
        .send({
          name: 'IntegNewBrewery',
          description: 'A new integration test brewery',
          image: 'https://test.com/brewery.jpg',
          origin_date: new Date('2020-01-01'),
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('IntegNewBrewery');
      expect(res.body.data.id).toBeDefined();
    });
  });

  it('POST /api/breweries — 403 for USER role', async () => {
    await withTestTransaction(async () => {
      const res = await request(app)
        .post('/api/breweries')
        .set('Authorization', `Bearer ${userToken(USER_ID)}`)
        .send({
          name: 'ShouldFail',
          description: 'Should not be created',
          image: 'https://test.com/brewery.jpg',
          origin_date: new Date('2020-01-01'),
        });

      expect(res.status).toBe(403);
    });
  });

  it('GET /api/breweries/:id returns brewery details', async () => {
    await withTestTransaction(async () => {
      const brewery = await createTestBrewery({ name: 'IntegDetailBrewery' });

      const res = await request(app)
        .get(`/api/breweries/${brewery.id}`)
        .set('Authorization', `Bearer ${userToken(USER_ID)}`);
      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('IntegDetailBrewery');
    });
  });

  it('GET /api/breweries/:id — 404 if not found', async () => {
    await withTestTransaction(async () => {
      const res = await request(app)
        .get('/api/breweries/999999')
        .set('Authorization', `Bearer ${userToken(USER_ID)}`);
      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('BREWERY_NOT_FOUND');
    });
  });

  it('PUT /api/breweries/:id updates brewery', async () => {
    await withTestTransaction(async () => {
      const brewery = await createTestBrewery();

      const res = await request(app)
        .put(`/api/breweries/${brewery.id}`)
        .set('Authorization', `Bearer ${adminToken()}`)
        .send({ name: 'IntegUpdatedBrewery' });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('IntegUpdatedBrewery');
    });
  });

  it('PUT /api/breweries/:id — 403 for USER role', async () => {
    await withTestTransaction(async () => {
      const brewery = await createTestBrewery();

      const res = await request(app)
        .put(`/api/breweries/${brewery.id}`)
        .set('Authorization', `Bearer ${userToken(USER_ID)}`)
        .send({ name: 'ShouldFail' });

      expect(res.status).toBe(403);
    });
  });

  it('DELETE /api/breweries/:id removes brewery', async () => {
    await withTestTransaction(async () => {
      const brewery = await createTestBrewery();

      const deleteRes = await request(app)
        .delete(`/api/breweries/${brewery.id}`)
        .set('Authorization', `Bearer ${adminToken()}`);
      expect(deleteRes.status).toBe(200);

      const getRes = await request(app)
        .get(`/api/breweries/${brewery.id}`)
        .set('Authorization', `Bearer ${userToken(USER_ID)}`);
      expect(getRes.status).toBe(404);
    });
  });

  it('DELETE /api/breweries/:id — 403 for USER role', async () => {
    await withTestTransaction(async () => {
      const brewery = await createTestBrewery();

      const res = await request(app)
        .delete(`/api/breweries/${brewery.id}`)
        .set('Authorization', `Bearer ${userToken(USER_ID)}`);
      expect(res.status).toBe(403);
    });
  });
});
