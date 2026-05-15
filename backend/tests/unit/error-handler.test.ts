import { describe, it, expect } from 'vitest';
import express, { Request, Response, NextFunction } from 'express';
import request from 'supertest';
import { errorHandler, notFoundHandler } from '../../src/middleware/error-handler';
import { HttpError } from '../../src/lib/http-error';

function buildApp(throwFn: (req: Request, res: Response, next: NextFunction) => void) {
  const app = express();
  app.get('/test', throwFn);
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

describe('notFoundHandler', () => {
  it('retourne 404 NOT_FOUND sur une route inconnue', async () => {
    const app = express();
    app.use(notFoundHandler);

    const res = await request(app).get('/route-inexistante');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});

describe('errorHandler', () => {
  it('gère HttpError et retourne le bon status/code', async () => {
    const app = buildApp((_req, _res, next) => {
      next(new HttpError(422, 'VALIDATION_ERROR', 'Données invalides'));
    });

    const res = await request(app).get('/test');
    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.message).toBe('Données invalides');
  });

  it('gère HttpError avec details', async () => {
    const app = buildApp((_req, _res, next) => {
      next(new HttpError(422, 'VALIDATION_ERROR', 'Erreur', [{ field: 'name', message: 'requis' }]));
    });

    const res = await request(app).get('/test');
    expect(res.status).toBe(422);
    expect(res.body.error.details).toEqual([{ field: 'name', message: 'requis' }]);
  });

  it('gère une Error standard avec 500', async () => {
    const app = buildApp((_req, _res, next) => {
      next(new Error('Erreur interne'));
    });

    const res = await request(app).get('/test');
    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INTERNAL_ERROR');
    expect(res.body.error.message).toBe('Erreur interne');
  });

  it('gère une erreur inconnue (non-Error) avec 500', async () => {
    const app = buildApp((_req, _res, next) => {
      next('une chaîne en guise d\'erreur');
    });

    const res = await request(app).get('/test');
    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INTERNAL_ERROR');
    expect(res.body.error.message).toBe('Une erreur inattendue est survenue');
  });
});
