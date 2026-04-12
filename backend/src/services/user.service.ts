import { Prisma, Role } from '@prisma/client';
import prisma from '../lib/prisma';
import { HttpError } from '../lib/http-error';

const userPublicSelect = {
  id: true,
  name: true,
  firstname: true,
  mail: true,
  birthday: true,
  adress: true,
  icon: true,
  role: true,
  deleted_at: true,
} satisfies Prisma.UserSelect;

export type UserPublic = Prisma.UserGetPayload<{ select: typeof userPublicSelect }>;

export interface CreateUserInput {
  name: string;
  firstname: string;
  mail: string;
  password: string;
  birthday: string;
  adress: string;
  icon?: string;
  role?: Role;
}

export interface UpdateUserInput {
  name?: string;
  firstname?: string;
  mail?: string;
  password?: string;
  birthday?: string;
  adress?: string;
  icon?: string;
  role?: Role;
}

export async function findAllUsers(): Promise<UserPublic[]> {
  return prisma.user.findMany({
    where: { deleted_at: null },
    select: userPublicSelect,
    orderBy: { id: 'asc' },
  });
}

export async function findUserById(id: number): Promise<UserPublic> {
  const user = await prisma.user.findFirst({
    where: { id, deleted_at: null },
    select: userPublicSelect,
  });

  if (!user) {
    throw new HttpError(404, 'USER_NOT_FOUND', 'Utilisateur introuvable');
  }

  return user;
}

export async function createUser(input: CreateUserInput): Promise<UserPublic> {
  const mailExists = await prisma.user.findFirst({
    where: { mail: input.mail, deleted_at: null },
    select: { id: true },
  });

  if (mailExists) {
    throw new HttpError(409, 'USER_MAIL_CONFLICT', 'Cet email est deja utilise');
  }

  return prisma.user.create({
    data: {
      name: input.name,
      firstname: input.firstname,
      mail: input.mail,
      password: input.password,
      birthday: new Date(input.birthday),
      adress: input.adress,
      icon: input.icon,
      role: input.role ?? Role.USER,
    },
    select: userPublicSelect,
  });
}

export async function updateUser(id: number, input: UpdateUserInput): Promise<UserPublic> {
  await ensureUserExists(id);

  if (input.mail) {
    const existing = await prisma.user.findFirst({
      where: {
        mail: input.mail,
        id: { not: id },
        deleted_at: null,
      },
      select: { id: true },
    });

    if (existing) {
      throw new HttpError(409, 'USER_MAIL_CONFLICT', 'Cet email est deja utilise');
    }
  }

  return prisma.user.update({
    where: { id },
    data: {
      name: input.name,
      firstname: input.firstname,
      mail: input.mail,
      password: input.password,
      birthday: input.birthday ? new Date(input.birthday) : undefined,
      adress: input.adress,
      icon: input.icon,
      role: input.role,
    },
    select: userPublicSelect,
  });
}

export async function softDeleteUser(id: number): Promise<void> {
  const existing = await prisma.user.findFirst({
    where: { id, deleted_at: null },
    select: { id: true, mail: true },
  });

  if (!existing) {
    throw new HttpError(404, 'USER_NOT_FOUND', 'Utilisateur introuvable');
  }

  await prisma.user.update({
    where: { id },
    data: {
      deleted_at: new Date(),
      mail: `${existing.mail}__deleted__${existing.id}__${Date.now()}`,
    },
  });
}

async function ensureUserExists(id: number): Promise<void> {
  const user = await prisma.user.findFirst({
    where: { id, deleted_at: null },
    select: { id: true },
  });

  if (!user) {
    throw new HttpError(404, 'USER_NOT_FOUND', 'Utilisateur introuvable');
  }
}
