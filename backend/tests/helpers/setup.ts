import { PrismaClient } from '@prisma/client';
import { vi, afterAll } from 'vitest';

// ─── Client Prisma dédié aux tests ──────────────────────────────────────────

const testPrisma = new PrismaClient();

// ─── Proxy transactionnel ───────────────────────────────────────────────────
// Pendant un test, _activeTx pointe vers le client transactionnel Prisma.
// Toutes les opérations Prisma passent par ce proxy, ce qui garantit
// l'isolation par transaction rollback.

let _activeTx: any = null;

export function setActiveTx(tx: any): void {
  _activeTx = tx;
}

export function clearActiveTx(): void {
  _activeTx = null;
}

const prismaProxy = new Proxy({} as PrismaClient, {
  get(_target, prop: string | symbol) {
    const client = _activeTx ?? testPrisma;

    // Intercepter $transaction quand on est dans une transaction de test :
    // les PrismaPromise sont déjà liées au client tx, on les exécute
    // séquentiellement au lieu de créer une sous-transaction.
    if (prop === '$transaction' && _activeTx) {
      return async (arg: unknown, _options?: unknown) => {
        if (Array.isArray(arg)) {
          const results = [];
          for (const op of arg) {
            results.push(await op);
          }
          return results;
        }
        if (typeof arg === 'function') {
          return (arg as (tx: any) => Promise<unknown>)(_activeTx);
        }
        throw new Error('Unsupported $transaction usage in test');
      };
    }

    const value = (client as any)[prop];
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  },
});

// Mock le module prisma pour que tous les services utilisent le proxy
vi.mock('../../src/lib/prisma', () => ({
  default: prismaProxy,
}));

export { testPrisma };

afterAll(async () => {
  await testPrisma.$disconnect();
});
