import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { Role } from '@prisma/client';
import prisma from '../lib/prisma';
import { HttpError } from '../lib/http-error';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RegisterInput {
  name: string;
  firstname: string;
  mail: string;
  password: string;
  birthday: string;
  adress: string;
  icon?: string;
}

export interface LoginInput {
  mail: string;
  password: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface AuthPayload {
  id: number;
  role: Role;
}

// ─── Helpers JWT ──────────────────────────────────────────────────────────────

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not defined');
  return secret;
}

function getJwtRefreshSecret(): string {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) throw new Error('JWT_REFRESH_SECRET is not defined');
  return secret;
}

function getAccessExpiry(): string {
  return process.env.JWT_ACCESS_EXPIRY ?? '1h';
}

function getRefreshExpiry(): string {
  return process.env.JWT_REFRESH_EXPIRY ?? '7d';
}

function generateAccessToken(userId: number, role: Role): string {
  return jwt.sign({ sub: userId, role }, getJwtSecret(), {
    expiresIn: getAccessExpiry() as jwt.SignOptions['expiresIn'],
  });
}

function generateRefreshToken(userId: number, jti: string): string {
  return jwt.sign({ sub: userId, jti }, getJwtRefreshSecret(), {
    expiresIn: getRefreshExpiry() as jwt.SignOptions['expiresIn'],
  });
}

function computeRefreshExpiry(): Date {
  const expiry = getRefreshExpiry();
  const ms = expiry === '7d' ? 7 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;
  return new Date(Date.now() + ms);
}

// ─── Service ──────────────────────────────────────────────────────────────────

const userAuthSelect = {
  id: true,
  name: true,
  firstname: true,
  mail: true,
  birthday: true,
  adress: true,
  icon: true,
  role: true,
} as const;

export async function register(input: RegisterInput): Promise<TokenPair> {
  const existing = await prisma.user.findFirst({
    where: { mail: input.mail, deleted_at: null },
    select: { id: true },
  });

  if (existing) {
    throw new HttpError(409, 'USER_MAIL_CONFLICT', 'Cet email est déjà utilisé');
  }

  const hashedPassword = await bcrypt.hash(input.password, 12);

  const user = await prisma.user.create({
    data: {
      name: input.name,
      firstname: input.firstname,
      mail: input.mail,
      password: hashedPassword,
      birthday: new Date(input.birthday),
      adress: input.adress,
      icon: input.icon,
      role: Role.USER,
    },
    select: { id: true, role: true },
  });

  return issueTokenPair(user.id, user.role);
}

export async function login(input: LoginInput): Promise<TokenPair> {
  const user = await prisma.user.findFirst({
    where: { mail: input.mail, deleted_at: null },
    select: { id: true, role: true, password: true },
  });

  if (!user) {
    throw new HttpError(401, 'INVALID_CREDENTIALS', 'Email ou mot de passe incorrect');
  }

  const passwordMatch = await bcrypt.compare(input.password, user.password);
  if (!passwordMatch) {
    throw new HttpError(401, 'INVALID_CREDENTIALS', 'Email ou mot de passe incorrect');
  }

  return issueTokenPair(user.id, user.role);
}

export async function refresh(rawRefreshToken: string): Promise<TokenPair> {
  let payload: { sub: number; jti: string };

  try {
    payload = jwt.verify(rawRefreshToken, getJwtRefreshSecret()) as unknown as { sub: number; jti: string };
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw new HttpError(401, 'TOKEN_EXPIRED', 'Le refresh token a expiré');
    }
    throw new HttpError(401, 'INVALID_TOKEN', 'Refresh token invalide');
  }

  const stored = await prisma.refreshToken.findUnique({
    where: { token: rawRefreshToken },
    select: { id: true, id_user: true, revoked_at: true, expires_at: true },
  });

  if (!stored || stored.revoked_at !== null || stored.expires_at < new Date()) {
    throw new HttpError(401, 'INVALID_TOKEN', 'Refresh token invalide ou révoqué');
  }

  // Rotation : invalider l'ancien token
  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revoked_at: new Date() },
  });

  const user = await prisma.user.findFirst({
    where: { id: stored.id_user, deleted_at: null },
    select: { id: true, role: true },
  });

  if (!user) {
    throw new HttpError(401, 'INVALID_TOKEN', 'Utilisateur introuvable');
  }

  return issueTokenPair(user.id, user.role);
}

export async function getMe(userId: number) {
  const user = await prisma.user.findFirst({
    where: { id: userId, deleted_at: null },
    select: userAuthSelect,
  });

  if (!user) {
    throw new HttpError(404, 'USER_NOT_FOUND', 'Utilisateur introuvable');
  }

  return user;
}

export async function logout(rawRefreshToken: string): Promise<void> {
  const stored = await prisma.refreshToken.findUnique({
    where: { token: rawRefreshToken },
    select: { id: true, revoked_at: true },
  });

  if (!stored || stored.revoked_at !== null) {
    return; // Déjà révoqué ou inexistant — idempotent
  }

  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revoked_at: new Date() },
  });
}

// ─── Utilitaire interne ───────────────────────────────────────────────────────

async function issueTokenPair(userId: number, role: Role): Promise<TokenPair> {
  const jti = randomUUID();
  const accessToken = generateAccessToken(userId, role);
  const rawRefreshToken = generateRefreshToken(userId, jti);

  await prisma.refreshToken.create({
    data: {
      id: jti,
      id_user: userId,
      token: rawRefreshToken,
      expires_at: computeRefreshExpiry(),
    },
  });

  return { accessToken, refreshToken: rawRefreshToken };
}
