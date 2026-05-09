import { NextFunction, Request, Response } from 'express';
import { ZodTypeAny } from 'zod';
import { HttpError } from '../lib/http-error';

type ValidationTarget = 'body' | 'params' | 'query';

export function validate(schema: ZodTypeAny, target: ValidationTarget = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const parseResult = schema.safeParse(req[target]);

    if (!parseResult.success) {
      const details = parseResult.error.issues.map((issue) => ({
        field: issue.path.join('.') || '_root',
        message: issue.message,
      }));
      throw new HttpError(400, 'VALIDATION_ERROR', 'Erreur de validation', details);
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
