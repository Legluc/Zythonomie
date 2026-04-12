import { NextFunction, Request, Response } from 'express';
import { ZodTypeAny } from 'zod';
import { HttpError } from '../lib/http-error';

type ValidationTarget = 'body' | 'params' | 'query';

export function validate(schema: ZodTypeAny, target: ValidationTarget = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const parseResult = schema.safeParse(req[target]);

    if (!parseResult.success) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'Donnees invalides', parseResult.error.flatten());
    }

    if (target === 'query') {
      Object.assign(req.query, parseResult.data as object);
    } else if (target === 'params') {
      Object.assign(req.params, parseResult.data as object);
    } else {
      req.body = parseResult.data;
    }

    next();
  };
}
