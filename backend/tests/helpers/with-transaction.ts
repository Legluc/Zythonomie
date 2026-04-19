import { testPrisma, setActiveTx, clearActiveTx } from './setup';

class RollbackError extends Error {
  constructor() {
    super('ROLLBACK');
    this.name = 'RollbackError';
  }
}

/**
 * Exécute `fn` dans une transaction Prisma interactive, puis force un rollback.
 * Toutes les opérations Prisma (services, factories) passent par le proxy
 * configuré dans setup.ts, et utilisent automatiquement le client tx.
 */
export async function withTestTransaction(fn: () => Promise<void>): Promise<void> {
  try {
    await testPrisma.$transaction(
      async (tx) => {
        setActiveTx(tx);
        try {
          await fn();
        } finally {
          clearActiveTx();
        }
        throw new RollbackError();
      },
      { timeout: 30000 },
    );
  } catch (error) {
    if (error instanceof RollbackError) return;
    throw error;
  }
}
