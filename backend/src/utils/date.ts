import { BadRequestError } from './errors';

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Checks both the shape and the actual calendar validity.
 * For example, "2026-02-30" matches the regex but is not a real date.
 */
export function isDateOnlyString(value: string): boolean {
  if (!DATE_ONLY_PATTERN.test(value)) {
    return false;
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);
  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
  );
}

/**
 * Converts an API date-only string into a Date at UTC midnight.
 * The database column is DATE, so no time component is stored.
 */
export function parseDateOnly(value: string): Date {
  if (!isDateOnlyString(value)) {
    throw new BadRequestError(
      'dueDate must be a valid calendar date in YYYY-MM-DD format.',
    );
  }
  return new Date(`${value}T00:00:00.000Z`);
}

/** Formats a database DATE value back to YYYY-MM-DD for the API. */
export function formatDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** The current calendar day at 00:00:00 UTC. */
export function startOfUtcDay(date = new Date()): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}
