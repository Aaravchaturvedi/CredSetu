import { z } from 'zod';
import { isDateOnlyString } from '../../utils/date';

/**
 * DECIMAL(12,2) allows ten integer digits and two decimal places.
 * Keeping the API limit identical means PostgreSQL never has to reject a
 * value that passed application validation.
 */
const MAX_AMOUNT = 9_999_999_999.99;

function hasAtMostTwoDecimals(value: number): boolean {
  const shifted = value * 100;
  return Math.abs(shifted - Math.round(shifted)) < 1e-8;
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export const createLoanSchema = z.object({
  friendName: z
    .string()
    .trim()
    .min(1, 'friendName cannot be empty.')
    .max(120, 'friendName must be at most 120 characters.'),

  amount: z
    .number()
    .positive('amount must be greater than zero.')
    .max(MAX_AMOUNT, `amount must be at most ${MAX_AMOUNT}.`)
    .refine(
      hasAtMostTwoDecimals,
      'amount must have at most two decimal places.',
    ),

  dueDate: z
    .string()
    .trim()
    .refine(
      isDateOnlyString,
      'dueDate must be a real calendar date in YYYY-MM-DD format.',
    ),

  // Optional. Clients should upload the image first, then pass the returned URL.
  receiptImageUrl: z
    .string()
    .trim()
    .max(2048, 'receiptImageUrl must be at most 2048 characters.')
    .refine(isHttpUrl, 'receiptImageUrl must be a valid http(s) URL.')
    .nullish()
    .transform((value) => value ?? undefined),
});

/** Route parameter validation for PATCH /loans/:id/repay. */
export const loanIdSchema = z.object({
  id: z.string().uuid('id must be a valid UUID.'),
});

export type CreateLoanInput = z.infer<typeof createLoanSchema>;
