import { describe, it, expect } from 'vitest';
import { withTestTransaction } from '../helpers/with-transaction';
import { createTestUser } from '../helpers/factories';
import {
  findAllUsers,
  findUserById,
  createUser,
  updateUser,
  softDeleteUser,
} from '../../src/services/user.service';

describe('user.service', () => {
  it('findAllUsers returns active users', async () => {
    await withTestTransaction(async () => {
      await createTestUser({ name: 'ActiveTestUser' });
      const users = await findAllUsers();
      expect(users.data.length).toBeGreaterThan(0);
      expect(users.data.some((u) => u.name === 'ActiveTestUser')).toBe(true);
    });
  });

  it('findUserById returns a user', async () => {
    await withTestTransaction(async () => {
      const created = await createTestUser();
      const found = await findUserById(created.id);
      expect(found.id).toBe(created.id);
      expect(found.name).toBe(created.name);
    });
  });

  it('findUserById throws 404 for non-existent user', async () => {
    await withTestTransaction(async () => {
      await expect(findUserById(999999)).rejects.toMatchObject({
        statusCode: 404,
        code: 'USER_NOT_FOUND',
      });
    });
  });

  it('createUser creates a user', async () => {
    await withTestTransaction(async () => {
      const user = await createUser({
        name: 'Doe',
        firstname: 'John',
        mail: `create-${Date.now()}@test.local`,
        password: 'secret123',
        birthday: '1990-05-20',
        adress: '42 Rue du Test',
      });

      expect(user.name).toBe('Doe');
      expect(user.firstname).toBe('John');
      expect(user.role).toBe('USER');
    });
  });

  it('createUser throws 409 for duplicate email', async () => {
    await withTestTransaction(async () => {
      const mail = `dup-${Date.now()}@test.local`;
      await createTestUser({ mail });

      await expect(
        createUser({
          name: 'Dup',
          firstname: 'Dup',
          mail,
          password: 'secret',
          birthday: '1990-01-01',
          adress: 'addr',
        }),
      ).rejects.toMatchObject({ statusCode: 409, code: 'USER_MAIL_CONFLICT' });
    });
  });

  it('updateUser updates user fields', async () => {
    await withTestTransaction(async () => {
      const user = await createTestUser();
      const updated = await updateUser(user.id, { name: 'Updated' });
      expect(updated.name).toBe('Updated');
    });
  });

  it('softDeleteUser soft-deletes and anonymizes email', async () => {
    await withTestTransaction(async () => {
      const user = await createTestUser();
      await softDeleteUser(user.id);

      await expect(findUserById(user.id)).rejects.toMatchObject({
        statusCode: 404,
        code: 'USER_NOT_FOUND',
      });
    });
  });
});
