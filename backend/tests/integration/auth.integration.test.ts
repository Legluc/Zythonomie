import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import { withTestTransaction } from '../helpers/with-transaction';

beforeAll(() => {
  process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-jwt-secret';
  process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? 'test-jwt-refresh-secret';
  process.env.JWT_ACCESS_EXPIRY = '1h';
  process.env.JWT_REFRESH_EXPIRY = '7d';
});

const testUser = () => ({
  name: 'Dupont',
  firstname: 'Marie',
  mail: `integ-auth-${Date.now()}-${Math.random().toString(36).slice(2)}@test.local`,
  password: 'securePassword123',
  birthday: '1992-06-15',
  adress: '10 Avenue de la Mousse',
});

describe('Auth Integration — POST /api/auth/register', () => {
  it('201 avec access + refresh token', async () => {
    await withTestTransaction(async () => {
      const res = await request(app).post('/api/auth/register').send(testUser());

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
    });
  });

  it('409 si email déjà utilisé', async () => {
    await withTestTransaction(async () => {
      const user = testUser();
      await request(app).post('/api/auth/register').send(user);

      const res = await request(app).post('/api/auth/register').send(user);
      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('USER_MAIL_CONFLICT');
    });
  });

  it('400 si données invalides (mot de passe trop court)', async () => {
    await withTestTransaction(async () => {
      const res = await request(app).post('/api/auth/register').send({
        ...testUser(),
        password: 'short',
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  it('400 si email invalide', async () => {
    await withTestTransaction(async () => {
      const res = await request(app).post('/api/auth/register').send({
        ...testUser(),
        mail: 'not-an-email',
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });
});

describe('Auth Integration — POST /api/auth/login', () => {
  it('200 avec tokens valides après inscription', async () => {
    await withTestTransaction(async () => {
      const user = testUser();
      await request(app).post('/api/auth/register').send(user);

      const res = await request(app).post('/api/auth/login').send({
        mail: user.mail,
        password: user.password,
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
    });
  });

  it('401 si mot de passe incorrect', async () => {
    await withTestTransaction(async () => {
      const user = testUser();
      await request(app).post('/api/auth/register').send(user);

      const res = await request(app).post('/api/auth/login').send({
        mail: user.mail,
        password: 'wrongPassword',
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });
  });

  it('401 si email inconnu', async () => {
    await withTestTransaction(async () => {
      const res = await request(app).post('/api/auth/login').send({
        mail: 'nobody@nowhere.local',
        password: 'anypassword123',
      });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });
  });
});

describe('Auth Integration — GET /api/auth/me', () => {
  it('200 avec profil si token valide', async () => {
    await withTestTransaction(async () => {
      const user = testUser();
      const regRes = await request(app).post('/api/auth/register').send(user);
      const { accessToken } = regRes.body.data;

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.mail).toBe(user.mail);
      expect(res.body.data.name).toBe(user.name);
    });
  });

  it('401 sans token', async () => {
    await withTestTransaction(async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  it('401 avec token invalide', async () => {
    await withTestTransaction(async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid.token.here');

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('INVALID_TOKEN');
    });
  });
});

describe('Auth Integration — POST /api/auth/refresh', () => {
  it('200 retourne de nouveaux tokens', async () => {
    await withTestTransaction(async () => {
      const user = testUser();
      const regRes = await request(app).post('/api/auth/register').send(user);
      const { refreshToken } = regRes.body.data;

      const res = await request(app).post('/api/auth/refresh').send({ refreshToken });

      expect(res.status).toBe(200);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
      expect(res.body.data.refreshToken).not.toBe(refreshToken);
    });
  });

  it('401 avec refresh token invalide', async () => {
    await withTestTransaction(async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid.refresh.token' });

      expect(res.status).toBe(401);
    });
  });

  it('401 si refresh token est révoqué après logout', async () => {
    await withTestTransaction(async () => {
      const user = testUser();
      const regRes = await request(app).post('/api/auth/register').send(user);
      const { accessToken, refreshToken } = regRes.body.data;

      // Logout et révoque le refresh token
      await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ refreshToken });

      // Essayer d'utiliser le refresh token révoqué — devrait échouer
      const res = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('INVALID_TOKEN');
    });
  });
});

describe('Auth Integration — POST /api/auth/logout', () => {
  it('200 et refresh token révoqué', async () => {
    await withTestTransaction(async () => {
      const user = testUser();
      const regRes = await request(app).post('/api/auth/register').send(user);
      const { accessToken, refreshToken } = regRes.body.data;

      const logoutRes = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ refreshToken });

      expect(logoutRes.status).toBe(200);

      // Après logout, le refresh token ne doit plus fonctionner
      const refreshRes = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken });

      expect(refreshRes.status).toBe(401);
    });
  });
});

describe('Auth Integration — flow complet register → login → me → refresh → logout', () => {
  it('flow complet réussi', async () => {
    await withTestTransaction(async () => {
      const user = testUser();

      // 1. Register
      const regRes = await request(app).post('/api/auth/register').send(user);
      expect(regRes.status).toBe(201);
      const { accessToken: accessToken1, refreshToken: refreshToken1 } = regRes.body.data;

      // 2. Login
      const loginRes = await request(app).post('/api/auth/login').send({
        mail: user.mail,
        password: user.password,
      });
      expect(loginRes.status).toBe(200);
      const { refreshToken: refreshToken2 } = loginRes.body.data;

      // 3. Me
      const meRes = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken1}`);
      expect(meRes.status).toBe(200);
      expect(meRes.body.data.mail).toBe(user.mail);

      // 4. Refresh (rotation)
      const refreshRes = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: refreshToken2 });
      expect(refreshRes.status).toBe(200);
      const { accessToken: accessToken3, refreshToken: refreshToken3 } = refreshRes.body.data;
      expect(refreshToken3).not.toBe(refreshToken2);

      // 5. Logout
      const logoutRes = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken3}`)
        .send({ refreshToken: refreshToken3 });
      expect(logoutRes.status).toBe(200);
    });
  });
});
