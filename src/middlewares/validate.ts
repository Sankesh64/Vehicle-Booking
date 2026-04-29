// ============================================================
// Zod Validation Middleware Factory
// Validates body, query, or params against a Zod schema
// ============================================================
import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { sendError } from '../utils/response';

type ValidationTarget = 'body' | 'query' | 'params';

export function validate(schema: ZodSchema, target: ValidationTarget = 'body') {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const data = schema.parse(req[target]);
      // Merge parsed and transformed data back into the request target
      Object.assign(req[target], data);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const fields: Record<string, string> = {};
        for (const issue of error.issues) {
          fields[issue.path.join('.')] = issue.message;
        }
        sendError(res, 400, 'VALIDATION_ERROR', 'Request validation failed', fields);
        return;
      }
      next(error);
    }
  };
}
