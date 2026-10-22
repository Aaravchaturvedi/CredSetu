import type { RequestHandler } from 'express';
import { ZodError, type ZodType } from 'zod';
import {
  ValidationError,
  type ValidationIssue,
} from '../utils/errors';

/** Converts Zod's issue objects into a compact, API-friendly shape. */
export function formatZodIssues(error: ZodError): ValidationIssue[] {
  return error.issues.map((issue) => ({
    path: issue.path.join('.') || 'body',
    message: issue.message,
  }));
}

/**
 * Parses untrusted input and throws our standard ValidationError on failure.
 * Used for route parameters (which are not covered by validateBody).
 */
export function parseOrThrow<T>(schema: ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new ValidationError(formatZodIssues(result.error));
  }
  return result.data;
}

/**
 * Validates `req.body` against a Zod schema and replaces it with the parsed
 * output. This is important because schemas may trim or normalize values.
 *
 * Express 5 automatically forwards rejected promises to the error handler, so
 * synchronous validation errors can be passed with next() and handled centrally.
 */
export function validateBody<T>(schema: ZodType<T>): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      next(new ValidationError(formatZodIssues(result.error)));
      return;
    }

    req.body = result.data;
    next();
  };
}
