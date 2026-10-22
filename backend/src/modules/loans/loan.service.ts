import type { Loan } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import {
  formatDateOnly,
  parseDateOnly,
  startOfUtcDay,
} from '../../utils/date';
import { NotFoundError } from '../../utils/errors';
import {
  calculateLoanSummary,
  isLoanOverdue,
  type LoanSummary,
} from '../../utils/loan';
import type { CreateLoanInput } from './loan.schemas';

/**
 * The public shape of a loan in API responses. It deliberately omits `userId`
 * (the client already knows who it is) and adds a computed `isOverdue` flag so
 * the mobile client does not need to reimplement business rules.
 */
export interface LoanDto {
  id: string;
  friendName: string;
  amount: number;
  dueDate: string;
  isRepaid: boolean;
  isOverdue: boolean;
  receiptImageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

function toLoanDto(loan: Loan, today: Date): LoanDto {
  return {
    id: loan.id,
    friendName: loan.friendName,
    // The database does exact Decimal math. The value is safely converted to
    // a number only for JSON because the allowed range is well below 2^53.
    amount: loan.amount.toNumber(),
    dueDate: formatDateOnly(loan.dueDate),
    isRepaid: loan.isRepaid,
    isOverdue: isLoanOverdue(loan, today),
    receiptImageUrl: loan.receiptImageUrl,
    createdAt: loan.createdAt.toISOString(),
    updatedAt: loan.updatedAt.toISOString(),
  };
}

export async function createLoan(
  userId: string,
  input: CreateLoanInput,
): Promise<LoanDto> {
  const loan = await prisma.loan.create({
    data: {
      userId,
      friendName: input.friendName,
      // Passing a fixed-point string avoids introducing float rounding when
      // Prisma writes into the DECIMAL(12,2) column.
      amount: input.amount.toFixed(2),
      dueDate: parseDateOnly(input.dueDate),
      receiptImageUrl: input.receiptImageUrl ?? null,
    },
  });

  return toLoanDto(loan, startOfUtcDay());
}

export async function listLoans(userId: string): Promise<LoanDto[]> {
  const today = startOfUtcDay();
  const loans = await prisma.loan.findMany({
    where: { userId },
    // Active loans first, then the most urgent due dates. Repaid history stays
    // at the bottom of the dashboard but is still returned.
    orderBy: [
      { isRepaid: 'asc' },
      { dueDate: 'asc' },
      { createdAt: 'desc' },
    ],
  });

  return loans.map((loan) => toLoanDto(loan, today));
}

/**
 * Idempotent repayment endpoint: repeating the request returns the same result
 * rather than an error. Ownership is checked together with the id, and a
 * missing or someone else's loan both produce a 404 to avoid leaking existence.
 */
export async function markLoanRepaid(
  userId: string,
  loanId: string,
): Promise<LoanDto> {
  const existing = await prisma.loan.findFirst({
    where: { id: loanId, userId },
  });

  if (!existing) {
    throw new NotFoundError('Loan not found.');
  }

  if (existing.isRepaid) {
    return toLoanDto(existing, startOfUtcDay());
  }

  const updated = await prisma.loan.update({
    where: { id: existing.id },
    data: { isRepaid: true },
  });

  return toLoanDto(updated, startOfUtcDay());
}

/**
 * Loads only the columns needed for the summary and delegates the arithmetic
 * to a pure function. This keeps the calculation unit-testable without a real
 * database.
 */
export async function getLoanSummary(userId: string): Promise<LoanSummary> {
  const loans = await prisma.loan.findMany({
    where: { userId },
    select: {
      amount: true,
      isRepaid: true,
      dueDate: true,
    },
  });

  return calculateLoanSummary(loans, startOfUtcDay());
}
