import { describe, it, expect, beforeAll } from 'vitest';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { withTestTransaction } from '../helpers/with-transaction';
import { createTestUser } from '../helpers/factories';
import { register, login, refresh, logout } from '../../src/services/auth.service';

// S'assurer que les variables JWT sont définies pour les tests
beforeAll(() => {
  process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-jwt-secret';
  process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? 'test-jwt-refresh-secret';
  process.env.JWT_ACCESS_EXPIRY = '1h';
  process.env.JWT_REFRESH_EXPIRY = '7d';
});

describe('auth.service — register', () => {
  it('crée un utilisateur et retourne un access + refresh token', async () => {
    await withTestTransaction(async () => {
      const mail = `register-${Date.now()}@test.local`;
      const tokens = await register({
        name: 'Doe',
        firstname: 'John',
        mail,
        password: 'securePass123',
        birthday: '1990-01-01',
        adress: '1 Rue de la Bière',
      });

      expect(tokens.accessToken).toBeDefined();
      expect(tokens.refreshToken).toBeDefined();
      expect(typeof tokens.accessToken).toBe('string');
      expect(typeof tokens.refreshToken).toBe('string');
    });
  });

  it('le mot de passe stocké est hashé (jamais en clair)', async () => {
    await withTestTransaction(async () => {
      const mail = `hashcheck-${Date.now()}@test.local`;
      const plainPassword = 'myPlainPassword';

      await register({
        name: 'Hash',
        firstname: 'Test',
        mail,
        password: plainPassword,
        birthday: '1990-01-01',
        adress: '1 Rue du Hash',
      });

      // Vérifier directement en DB que le mot de passe n'est pas en clair
      // On utilise l'import direct du module prisma (proxy transactionnel en test)
      const prisma = (await import('../../src/lib/prisma')).default;
      const user = await prisma.user.findFirst({
        where: { mail },
        select: { password: true },
      });

      expect(user).not.toBeNull();
      expect(user!.password).not.toBe(plainPassword);
      expect(user!.password.startsWith('$2b$')).toBe(true);

      const isValid = await bcrypt.compare(plainPassword, user!.password);
      expect(isValid).toBe(true);
    });
  });

  it('retourne 409 si l\'email est déjà utilisé', async () => {
    await withTestTransaction(async () => {
      const mail = `dup-${Date.now()}@test.local`;
      await register({
        name: 'First',
        firstname: 'User',
        mail,
        password: 'password123',
        birthday: '1990-01-01',
        adress: '1 Rue',
      });

      await expect(
        register({
          name: 'Second',
          firstname: 'User',
          mail,
          password: 'password456',
          birthday: '1991-01-01',
          adress: '2 Rue',
        }),
      ).rejects.toMatchObject({
        statusCode: 409,
        code: 'USER_MAIL_CONFLICT',
      });
    });
  });
});

describe('auth.service — login', () => {
  it('login correct retourne access + refresh token', async () => {
    await withTestTransaction(async () => {
      const mail = `login-ok-${Date.now()}@test.local`;
      const password = 'correctPassword123';

      // Créer un user via register (mot de passe hashé)
      await register({
        name: 'Login',
        firstname: 'User',
        mail,
        password,
        birthday: '1990-01-01',
        adress: '1 Rue',
      });

      const tokens = await login({ mail, password });

      expect(tokens.accessToken).toBeDefined();
      expect(tokens.refreshToken).toBeDefined();

      // Vérifier le contenu du access token
      const payload = jwt.verify(tokens.accessToken, process.env.JWT_SECRET!) as any;
      expect(typeof payload.sub).toBe('number');
      expect(['USER', 'ADMIN']).toContain(payload.role);
    });
  });

  it('login avec mauvais mot de passe retourne 401', async () => {
    await withTestTransaction(async () => {
      const mail = `login-bad-${Date.now()}@test.local`;

      await register({
        name: 'Login',
        firstname: 'Bad',
        mail,
        password: 'correctPassword123',
        birthday: '1990-01-01',
        adress: '1 Rue',
      });

      await expect(login({ mail, password: 'wrongPassword' })).rejects.toMatchObject({
        statusCode: 401,
        code: 'INVALID_CREDENTIALS',
      });
    });
  });

  it('login avec email inexistant retourne 401', async () => {
    await withTestTransaction(async () => {
      await expect(
        login({ mail: 'nobody@nowhere.local', password: 'anything' }),
      ).rejects.toMatchObject({
        statusCode: 401,
        code: 'INVALID_CREDENTIALS',
      });
    });
  });
});

describe('auth.service — refresh', () => {
  it('refresh valide retourne de nouveaux tokens (rotation)', async () => {
    await withTestTransaction(async () => {
      const mail = `refresh-ok-${Date.now()}@test.local`;

      await register({
        name: 'Refresh',
        firstname: 'User',
        mail,
        password: 'password123',
        birthday: '1990-01-01',
        adress: '1 Rue',
      });

      const tokens1 = await login({ mail, password: 'password123' });
      const tokens2 = await refresh(tokens1.refreshToken);

      expect(tokens2.accessToken).toBeDefined();
      expect(tokens2.refreshToken).toBeDefined();
      // Le nouveau refresh token doit être différent de l'ancien
      expect(tokens2.refreshToken).not.toBe(tokens1.refreshToken);
    });
  });

  it('l\'ancien refresh token est révoqué après rotation', async () => {
    await withTestTransaction(async () => {
      const mail = `refresh-revoke-${Date.now()}@test.local`;

      await register({
        name: 'Revoke',
        firstname: 'User',
        mail,
        password: 'password123',
        birthday: '1990-01-01',
        adress: '1 Rue',
      });

      const tokens = await login({ mail, password: 'password123' });
      await refresh(tokens.refreshToken);

      // Utiliser l'ancien refresh token → doit échouer
      await expect(refresh(tokens.refreshToken)).rejects.toMatchObject({
        statusCode: 401,
        code: 'INVALID_TOKEN',
      });
    });
  });

  it('refresh avec token invalide retourne 401', async () => {
    await withTestTransaction(async () => {
      await expect(refresh('invalid.token.string')).rejects.toMatchObject({
        statusCode: 401,
        code: 'INVALID_TOKEN',
      });
    });
  });
});

describe('auth.service — logout', () => {
  it('logout révoque le refresh token', async () => {
    await withTestTransaction(async () => {
      const mail = `logout-${Date.now()}@test.local`;

      await register({
        name: 'Logout',
        firstname: 'User',
        mail,
        password: 'password123',
        birthday: '1990-01-01',
        adress: '1 Rue',
      });

      const tokens = await login({ mail, password: 'password123' });
      await logout(tokens.refreshToken);

      // Après logout, le refresh token ne doit plus fonctionner
      await expect(refresh(tokens.refreshToken)).rejects.toMatchObject({
        statusCode: 401,
        code: 'INVALID_TOKEN',
      });
    });
  });

  it('logout est idempotent (token déjà révoqué ne lève pas d\'erreur)', async () => {
    await withTestTransaction(async () => {
      const mail = `logout-idem-${Date.now()}@test.local`;

      await register({
        name: 'Logout',
        firstname: 'Idem',
        mail,
        password: 'password123',
        birthday: '1990-01-01',
        adress: '1 Rue',
      });

      const tokens = await login({ mail, password: 'password123' });
      await logout(tokens.refreshToken);

      // Deuxième logout ne doit pas lever d'erreur
      await expect(logout(tokens.refreshToken)).resolves.toBeUndefined();
    });
  });
});
