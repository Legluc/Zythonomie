import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import { withTestTransaction } from '../helpers/with-transaction';
import { createTestBeer, createTestBrewery, createTestCategory } from '../helpers/factories';
import { adminToken, userToken } from '../helpers/auth-helpers';

beforeAll(() => {
  process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-jwt-secret';
  process.env.JWT_ACCESS_EXPIRY = '1h';
});

// Utilisateur fictif n°1 pour les GET authentifiés
const USER_ID = 1;

describe('Beers Integration', () => {
  it('GET /api/beers returns list with ApiResponse format', async () => {
    await withTestTransaction(async () => {
      await createTestBeer({ name: 'IntegGetBeer' });

      const res = await request(app)
        .get('/api/beers')
        .set('Authorization', `Bearer ${userToken(USER_ID)}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.some((b: any) => b.name === 'IntegGetBeer')).toBe(true);
    });
  });

  it('POST /api/beers creates a beer (201)', async () => {
    await withTestTransaction(async () => {
      const res = await request(app)
        .post('/api/beers')
        .set('Authorization', `Bearer ${adminToken()}`)
        .send({
          name: 'IntegNewBeer',
          description: 'A new integration test beer',
          alcool: true,
          percentage_alcool: 5.0,
          EAN: 7777777,
          image: 'https://test.com/integ.jpg',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('IntegNewBeer');
      expect(res.body.data.id).toBeDefined();
    });
  });

  it('GET /api/beers/:id returns a beer', async () => {
    await withTestTransaction(async () => {
      const beer = await createTestBeer({ name: 'IntegDetailBeer' });

      const res = await request(app)
        .get(`/api/beers/${beer.id}`)
        .set('Authorization', `Bearer ${userToken(USER_ID)}`);
      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('IntegDetailBeer');
    });
  });

  it('PUT /api/beers/:id updates a beer', async () => {
    await withTestTransaction(async () => {
      const beer = await createTestBeer();

      const res = await request(app)
        .put(`/api/beers/${beer.id}`)
        .set('Authorization', `Bearer ${adminToken()}`)
        .send({ name: 'IntegUpdatedBeer' });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('IntegUpdatedBeer');
    });
  });

  it('DELETE /api/beers/:id soft-deletes', async () => {
    await withTestTransaction(async () => {
      const beer = await createTestBeer();

      const deleteRes = await request(app)
        .delete(`/api/beers/${beer.id}`)
        .set('Authorization', `Bearer ${adminToken()}`);
      expect(deleteRes.status).toBe(200);

      const getRes = await request(app)
        .get(`/api/beers/${beer.id}`)
        .set('Authorization', `Bearer ${userToken(USER_ID)}`);
      expect(getRes.status).toBe(404);
    });
  });

  it('GET /api/beers?alcool=true filters correctly', async () => {
    await withTestTransaction(async () => {
      await createTestBeer({ name: 'IntegAlcool', alcool: true });
      await createTestBeer({ name: 'IntegNoAlcool', alcool: false });

      const res = await request(app)
        .get('/api/beers?alcool=true')
        .set('Authorization', `Bearer ${userToken(USER_ID)}`);
      expect(res.status).toBe(200);
      expect(res.body.data.some((b: any) => b.name === 'IntegAlcool')).toBe(true);
      expect(res.body.data.some((b: any) => b.name === 'IntegNoAlcool')).toBe(false);
    });
  });

  it('POST /api/beers/:id/breweries links a brewery', async () => {
    await withTestTransaction(async () => {
      const beer = await createTestBeer();
      const brewery = await createTestBrewery();

      const res = await request(app)
        .post(`/api/beers/${beer.id}/breweries`)
        .set('Authorization', `Bearer ${adminToken()}`)
        .send({ id_brewery: brewery.id });

      expect(res.status).toBe(200);
      expect(res.body.data.breweries.length).toBe(1);
    });
  });

  it('GET /api/beers/999999 returns 404', async () => {
    await withTestTransaction(async () => {
      const res = await request(app)
        .get('/api/beers/999999')
        .set('Authorization', `Bearer ${userToken(USER_ID)}`);
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('BEER_NOT_FOUND');
    });
  });
});
