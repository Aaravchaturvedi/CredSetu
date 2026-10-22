import type { Request, RequestHandler } from 'express';
import { parseOrThrow } from '../../middleware/validate';
import { UnauthorizedError } from '../../utils/errors';
import type { CreateLoanInput } from './loan.schemas';
import { loanIdSchema } from './loan.schemas';
import {
  createLoan,
  getLoanSummary,
  listLoans,
  markLoanRepaid,
} from './loan.service';

/**
 * `authenticate` guarantees this for protected routes, but TypeScript cannot
 * know that from the route setup. This helper turns the optional request
 * property into a checked value without using a non-null assertion.
 */
function getUserId(req: Request): string {
  if (!req.user) {
    throw new UnauthorizedError('Authentication required.');
  }
  return req.user.id;
}

export const createLoanHandler: RequestHandler<
  Record<string, never>,
  unknown,
  CreateLoanInput
> = async (req, res) => {
  const loan = await createLoan(getUserId(req), req.body);
  res.status(201).json({ loan });
};

export const listLoansHandler: RequestHandler = async (req, res) => {
  const loans = await listLoans(getUserId(req));
  res.status(200).json({ loans });
};

export const loanSummaryHandler: RequestHandler = async (req, res) => {
  // The spec asks for the summary object directly, so it is not wrapped in a
  // `{ summary: ... }` envelope.
  const summary = await getLoanSummary(getUserId(req));
  res.status(200).json(summary);
};

export const repayLoanHandler: RequestHandler<{ id: string }> = async (
  req,
  res,
) => {
  // Validate before touching the database; a malformed UUID would otherwise
  // become a low-level database error.
  const { id } = parseOrThrow(loanIdSchema, req.params);
  const loan = await markLoanRepaid(getUserId(req), id);
  res.status(200).json({ loan });
};
