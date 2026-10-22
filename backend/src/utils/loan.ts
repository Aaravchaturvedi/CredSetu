import { Prisma } from '@prisma/client';
import { startOfUtcDay } from './date';

export interface LoanSummary {
  totalLent: number;
  totalRepaid: number;
  totalOverdue: number;
}

/**
 * Minimum shape needed to calculate the dashboard summary. Keeping this
 * separate from the full Prisma `Loan` type makes the calculation easy to
 * unit test with plain objects.
 */
export interface SummarySourceLoan {
  amount: Prisma.Decimal | string | number;
  dueDate: Date;
  isRepaid: boolean;
}

export function isLoanOverdue(
  loan: { dueDate: Date; isRepaid: boolean },
  today = startOfUtcDay(),
): boolean {
  // A loan due today is not late yet; it becomes overdue the next day.
  return !loan.isRepaid && loan.dueDate.getTime() < today.getTime();
}

/**
 * Totals are intentionally overlapping:
 * - totalLent: every amount ever recorded
 * - totalRepaid: the subset marked repaid
 * - totalOverdue: the unpaid subset whose due date has passed
 *
 * Decimal arithmetic is used while summing so floating-point drift cannot
 * affect the totals. We convert to a number only at the JSON boundary.
 */
export function calculateLoanSummary(
  loans: SummarySourceLoan[],
  today = startOfUtcDay(),
): LoanSummary {
  let totalLent = new Prisma.Decimal(0);
  let totalRepaid = new Prisma.Decimal(0);
  let totalOverdue = new Prisma.Decimal(0);

  for (const loan of loans) {
    const amount = new Prisma.Decimal(loan.amount.toString());
    totalLent = totalLent.plus(amount);

    if (loan.isRepaid) {
      totalRepaid = totalRepaid.plus(amount);
    } else if (isLoanOverdue(loan, today)) {
      totalOverdue = totalOverdue.plus(amount);
    }
  }

  return {
    totalLent: totalLent.toNumber(),
    totalRepaid: totalRepaid.toNumber(),
    totalOverdue: totalOverdue.toNumber(),
  };
}
