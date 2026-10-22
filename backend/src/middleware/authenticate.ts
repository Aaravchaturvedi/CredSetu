import type { RequestHandler } from 'express';
import { verifyAccessToken } from '../lib/jwt';
import { UnauthorizedError } from '../utils/errors';

/**
 * Protects routes by requiring `Authorization: Bearer <jwt>`.
 * On success, the verified user's id is attached to `req.user`.
 */
export const authenticate: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    next(new UnauthorizedError('A Bearer token is required.'));
    return;
  }

  const token = header.slice('Bearer '.length).trim();
  if (!token) {
    next(new UnauthorizedError('A Bearer token is required.'));
    return;
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub };
    next();
  } catch {
    // Deliberately do not expose whether the token was expired or malformed.
    next(new UnauthorizedError('Invalid or expired token.'));
  }
};
