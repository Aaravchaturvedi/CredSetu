import { z } from 'zod';
import {
  isValidNormalizedPhone,
  normalizePhone,
} from '../../utils/phone';

/**
 * Accepts common formatting on input, then stores one canonical value.
 * The transform runs before the refine, so both steps operate on the
 * normalized "+<digits>" form.
 */
export const phoneSchema = z
  .string()
  .trim()
  .min(8, 'phone must be at least 8 characters.')
  .max(20, 'phone must be at most 20 characters.')
  .transform(normalizePhone)
  .refine(
    isValidNormalizedPhone,
    'phone must contain 8 to 15 digits (including country code).',
  );

export const requestOtpSchema = z.object({
  phone: phoneSchema,
});

export const verifyOtpSchema = z.object({
  phone: phoneSchema,
  otp: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'otp must be exactly 6 digits.'),
});

export type RequestOtpInput = z.infer<typeof requestOtpSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
