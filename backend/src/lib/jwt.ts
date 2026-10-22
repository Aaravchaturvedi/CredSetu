import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';

export interface AccessTokenPayload {
  /** The user's database id. `sub` is the JWT standard claim for "subject". */
  sub: string;
  /** Stored as a convenience claim; never trust it for authorization. */
  phone: string;
}

/**
 * Creates a real, signed JWT for the mock authentication flow.
 *
 * The token is "mock" only in the sense that the OTP is not delivered by SMS.
 * The signature and expiry are real, so protected routes still verify that the
 * request came from a successful login.
 */
export function signAccessToken(user: {
  id: string;
  phoneNumber: string;
}): string {
  return jwt.sign({ phone: user.phoneNumber }, env.JWT_SECRET, {
    subject: user.id,
    expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
  });
}

/**
 * Verifies the signature and expiry, then returns the claims we care about.
 * Throws if the token is malformed, tampered with, or expired.
 */
export function verifyAccessToken(token: string): AccessTokenPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET);

  if (
    typeof decoded === 'string' ||
    typeof decoded.sub !== 'string' ||
    typeof decoded.phone !== 'string'
  ) {
    throw new Error('Malformed access token payload.');
  }

  return { sub: decoded.sub, phone: decoded.phone };
}
