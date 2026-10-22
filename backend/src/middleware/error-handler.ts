import { Prisma } from '@prisma/client';
import type {
  ErrorRequestHandler,
  RequestHandler,
  Response,
} from 'express';
import multer from 'multer';
import { ZodError } from 'zod';
import { env } from '../config/env';
import { AppError } from '../utils/errors';
import { formatZodIssues } from './validate';

function sendError(
  res: Response,
  statusCode: number,
  code: string,
  message: string,
  details?: unknown,
): void {
  res.status(statusCode).json({
    error: {
      code,
      message,
      ...(details === undefined ? {} : { details }),
    },
  });
}

/** Catches requests that did not match any route. */
export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(
    new AppError(
      404,
      `Cannot ${req.method} ${req.originalUrl}.`,
      'ROUTE_NOT_FOUND',
    ),
  );
};

/**
 * Single error boundary for the whole API.
 *
 * Express recognizes this as error middleware because it has four arguments.
 * Controllers/services can throw and let this translate the error into a
 * consistent JSON response.
 */
export const errorHandler: ErrorRequestHandler = (
  error,
  _req,
  res,
  _next,
) => {
  if (error instanceof AppError) {
    sendError(res, error.statusCode, error.code, error.message, error.details);
    return;
  }

  // Safety net for any Zod error thrown outside validateBody/parseOrThrow.
  if (error instanceof ZodError) {
    sendError(
      res,
      400,
      'VALIDATION_ERROR',
      'Validation failed.',
      formatZodIssues(error),
    );
    return;
  }

  if (error instanceof multer.MulterError) {
    const message =
      error.code === 'LIMIT_FILE_SIZE'
        ? 'Receipt image must be 5 MB or smaller.'
        : `Upload failed: ${error.message}`;
    sendError(res, 400, 'UPLOAD_ERROR', message);
    return;
  }

  // Malformed JSON sent to express.json().
  if (error instanceof SyntaxError && 'body' in error) {
    sendError(res, 400, 'INVALID_JSON', 'The request body is not valid JSON.');
    return;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2025') {
      sendError(res, 404, 'NOT_FOUND', 'The requested record was not found.');
      return;
    }
    if (error.code === 'P2002') {
      sendError(res, 409, 'CONFLICT', 'That record already exists.');
      return;
    }
  }

  // Unexpected errors should be logged with their original stack trace, but
  // production clients should not receive internal implementation details.
  console.error('[MiniLedger] Unhandled error:', error);
  sendError(
    res,
    500,
    'INTERNAL_SERVER_ERROR',
    env.NODE_ENV === 'production'
      ? 'An unexpected error occurred.'
      : error instanceof Error
        ? error.message
        : 'An unexpected error occurred.',
  );
};
