/**
 * Normalizes user-entered phone numbers into a single stored representation:
 * a leading "+" followed by digits. This means "+91 98765-43210",
 * "919876543210", and "+919876543210" all match the same account.
 *
 * This is intentionally simple for the mock flow. A production system would
 * use a library like libphonenumber to validate country codes and formats.
 */
export function normalizePhone(input: string): string {
  const digits = input.replace(/\D/g, '');
  return `+${digits}`;
}

/**
 * E.164-like validation: 8-15 digits, starting with a non-zero digit.
 * (E.164 itself allows up to 15 digits.)
 */
export function isValidNormalizedPhone(phone: string): boolean {
  return /^\+[1-9]\d{7,14}$/.test(phone);
}
