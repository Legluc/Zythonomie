/**
 * Tests d'integration -- Phase 4 : Roles et permissions
 *
 * Scenarios couverts :
 *  - 401 sans token sur les routes protegees
 *  - 403 USER sur routes reservees ADMIN
 *  - 403 USER sur donnees d'un autre utilisateur
 *  - Impossibilite de s'auto-promouvoir ADMIN (PUT /api/users/:id)
 *  - ADMIN peut acceder aux ressources de tous les utilisateurs
 */

import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import { withTestTransaction } from '../helpers/with-transaction';

beforeAll(() => {
  process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-jwt-secret';
  process.env.JWT_REFRESH_SECRET =
    process.env.JWT_REFRESH_SECRET ?? 'test-jwt-refresh-secret';
  process.env.JWT_ACCESS_EXPIRY = '1h';
  process.env.JWT_REFRESH_EXPIRY = '7d';
});

// ---- Helpers ----------------------------------------------------------------

let _counter = 0;

function uniqueMail(prefix: string) {
  return `perm-${prefix}-${Date.now()}-${++_counter}@test.local`;
}

function userPayload(prefix = 'user') {
  return {
    name: 'Test',
    firstname: 'User',
    mail: uniqueMail(prefix),
    password: 'securePassword123',
    birthday: '1990-01-01',
    adress: '1 Rue du Test',
  };
}

async function registerAndLogin(payload: ReturnType<typeof userPayload>) {
  const res = await request(app).post('/api/auth/register').send(payload);
  expect(res.status).toBe(201);
  const { accessToken } = res.body.data;

  const me = await request(app)
    .get('/api/auth/me')
    .set('Authorization', `Bearer ${accessToken}`);
  const userId: number = me.body.data.id;

  return { accessToken, userId };
}

async function makeAdminToken(): Promise<{ adminToken: string; adminId: number }> {
  const prisma = (await import('../../src/lib/prisma')).default;

  const payload = userPayload('admin-seed');
  const regRes = await request(app).post('/api/auth/register').send(payload);
  expect(regRes.status).toBe(201);

  const { accessToken: tmpToken } = regRes.body.data;
  const me = await request(app)
    .get('/api/auth/me')
    .set('Authorization', `Bearer ${tmpToken}`);
  const userId: number = me.body.data.id;

  await prisma.user.update({ where: { id: userId }, data: { role: 'ADMIN' } });

  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ mail: payload.mail, password: payload.password });
  expect(loginRes.status).toBe(200);

  return { adminToken: loginRes.body.data.accessToken, adminId: userId };
}

// ---- 1. Routes protegees -- 401 sans token ----------------------------------

describe('Permissions -- 401 sans token sur les routes protegees', () => {
  const protectedRoutes: Array<{
    method: 'get' | 'post' | 'put' | 'delete';
    path: string;
  }> = [
    { method: 'get', path: '/api/beers' },
    { method: 'get', path: '/api/breweries' },
    { method: 'get', path: '/api/categories' },
    { method: 'get', path: '/api/pairings' },
    { method: 'get', path: '/api/criteria' },
    { method: 'post', path: '/api/beers' },
    { method: 'post', path: '/api/breweries' },
    { method: 'post', path: '/api/categories' },
    { method: 'post', path: '/api/ratings' },
    { method: 'get', path: '/api/users' },
    { method: 'get', path: '/api/users/1' },
    { method: 'get', path: '/api/recommendations/user/1' },
    { method: 'post', path: '/api/quizz-sessions' },
    { method: 'get', path: '/api/beer-criteria/1' },
    { method: 'get', path: '/api/user-criteria/1' },
  ];

  for (const { method, path } of protectedRoutes) {
    it(`${method.toUpperCase()} ${path} retourne 401 sans token`, async () => {
      await withTestTransaction(async () => {
        const res = await request(app)[method](path);
        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
        expect(res.body.error.code).toBe('UNAUTHORIZED');
      });
    });
  }
});

// ---- 2. Routes ADMIN -- 403 pour un USER normal ----------------------------

describe('Permissions -- 403 USER sur routes reservees ADMIN', () => {
  it('POST /api/beers retourne 403 pour un USER', async () => {
    await withTestTransaction(async () => {
      const { accessToken } = await registerAndLogin(userPayload());

      const res = await request(app)
        .post('/api/beers')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'Test Beer', description: 'desc', alcohol_content: 5.0 });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });

  it('POST /api/breweries retourne 403 pour un USER', async () => {
    await withTestTransaction(async () => {
      const { accessToken } = await registerAndLogin(userPayload());

      const res = await request(app)
        .post('/api/breweries')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'Brasserie Test', country: 'FR' });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });

  it('POST /api/categories retourne 403 pour un USER', async () => {
    await withTestTransaction(async () => {
      const { accessToken } = await registerAndLogin(userPayload());

      const res = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'IPA' });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });

  it('GET /api/users retourne 403 pour un USER (liste reservee ADMIN)', async () => {
    await withTestTransaction(async () => {
      const { accessToken } = await registerAndLogin(userPayload());

      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });

  it('POST /api/users retourne 403 pour un USER (creation directe reservee ADMIN)', async () => {
    await withTestTransaction(async () => {
      const { accessToken } = await registerAndLogin(userPayload());

      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(userPayload('new'));

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });
});

// ---- 3. Routes proprietaire -- 403 si autre utilisateur --------------------

describe('Permissions -- 403 USER sur donnees d autre utilisateur', () => {
  it("GET /api/users/:id retourne 403 si acces au profil d'un autre", async () => {
    await withTestTransaction(async () => {
      const userA = await registerAndLogin(userPayload('a'));
      const userB = await registerAndLogin(userPayload('b'));

      const res = await request(app)
        .get(`/api/users/${userB.userId}`)
        .set('Authorization', `Bearer ${userA.accessToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });

  it("PUT /api/users/:id retourne 403 si modification du profil d'un autre", async () => {
    await withTestTransaction(async () => {
      const userA = await registerAndLogin(userPayload('a2'));
      const userB = await registerAndLogin(userPayload('b2'));

      const res = await request(app)
        .put(`/api/users/${userB.userId}`)
        .set('Authorization', `Bearer ${userA.accessToken}`)
        .send({ name: 'Hacke' });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });

  it("GET /api/recommendations/user/:id retourne 403 si acces aux recommandations d'un autre", async () => {
    await withTestTransaction(async () => {
      const userA = await registerAndLogin(userPayload('a3'));
      const userB = await registerAndLogin(userPayload('b3'));

      const res = await request(app)
        .get(`/api/recommendations/user/${userB.userId}`)
        .set('Authorization', `Bearer ${userA.accessToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });

  it("GET /api/user-criteria/:id_user retourne 403 si acces aux criteres d'un autre", async () => {
    await withTestTransaction(async () => {
      const userA = await registerAndLogin(userPayload('a4'));
      const userB = await registerAndLogin(userPayload('b4'));

      const res = await request(app)
        .get(`/api/user-criteria/${userB.userId}`)
        .set('Authorization', `Bearer ${userA.accessToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });
});

// ---- 4. Auto-promotion ADMIN impossible ------------------------------------

describe('Permissions -- Auto-promotion ADMIN impossible', () => {
  it("PUT /api/users/:id avec role ADMIN ne doit pas promouvoir l'utilisateur", async () => {
    await withTestTransaction(async () => {
      const { accessToken, userId } = await registerAndLogin(userPayload('self'));

      await request(app)
        .put(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ role: 'ADMIN' });

      // Le role ne doit PAS avoir change -- on verifie via /api/auth/me
      const meRes = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(meRes.status).toBe(200);
      expect(meRes.body.data.role).toBe('USER');
    });
  });
});

// ---- 5. ADMIN peut acceder aux ressources de tous les utilisateurs ----------

describe('Permissions -- ADMIN peut acceder aux ressources protegees', () => {
  it('ADMIN peut voir la liste des utilisateurs', async () => {
    await withTestTransaction(async () => {
      const { adminToken } = await makeAdminToken();

      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  it("ADMIN peut acceder au profil d'un autre utilisateur", async () => {
    await withTestTransaction(async () => {
      const { adminToken } = await makeAdminToken();
      const { userId: otherUserId } = await registerAndLogin(userPayload('other'));

      const res = await request(app)
        .get(`/api/users/${otherUserId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  it("ADMIN peut voir les recommandations d'un autre utilisateur", async () => {
    await withTestTransaction(async () => {
      const { adminToken } = await makeAdminToken();
      const { userId: otherUserId } = await registerAndLogin(userPayload('rec'));

      const res = await request(app)
        .get(`/api/recommendations/user/${otherUserId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      // 200 (liste vide) ou 404 selon la logique, en tout cas pas 403
      expect(res.status).not.toBe(403);
    });
  });
});
