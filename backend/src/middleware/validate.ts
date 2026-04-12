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

    req[target] = parseResult.data;
    next();
  };
}
