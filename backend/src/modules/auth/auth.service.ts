import { createHash, randomInt, timingSafeEqual } from 'node:crypto';
import { env } from '../../config/env';
import { signAccessToken } from '../../lib/jwt';
import { prisma } from '../../lib/prisma';
import { UnauthorizedError } from '../../utils/errors';

const OTP_LENGTH = 6;
const OTP_SPACE = 10 ** OTP_LENGTH; // 000000..999999

export interface LoginResult {
  token: string;
  user: {
    id: string;
    phone: string;
  };
}

/**
 * Returns a cryptographically random 6-digit code, including leading zeroes.
 * randomInt() is preferable to Math.random() because it is designed for
 * security-sensitive values and avoids modulo bias.
 */
function generateOtp(): string {
  return randomInt(0, OTP_SPACE).toString().padStart(OTP_LENGTH, '0');
}

/**
 * OTPs are short and low-entropy, so a plain hash is not strong protection.
 * Binding the hash to the phone number at least prevents one hash from being
 * replayed for a different number. A production system would also use rate
 * limiting, a separate secret pepper, and a real SMS provider.
 */
function hashOtp(phone: string, otp: string): string {
  return createHash('sha256').update(`${phone}:${otp}`).digest('hex');
}

function otpMatches(phone: string, otp: string, expectedHash: string): boolean {
  const expected = Buffer.from(expectedHash, 'hex');
  const actual = Buffer.from(hashOtp(phone, otp), 'hex');

  // timingSafeEqual requires equal lengths. Both are SHA-256 hex strings here,
  // but checking the length first keeps the function safe if data is corrupt.
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

/**
 * Creates a new OTP and prints it to the console instead of sending an SMS.
 *
 * Any previous unconsumed OTP for this phone is marked consumed inside the same
 * transaction, so there is only one usable login code at a time.
 */
export async function requestLoginOtp(phone: string): Promise<void> {
  const otp = generateOtp();
  const now = new Date();
  const expiresAt = new Date(
    now.getTime() + env.OTP_TTL_MINUTES * 60 * 1_000,
  );

  await prisma.$transaction([
    prisma.otpCode.updateMany({
      where: { phoneNumber: phone, consumedAt: null },
      data: { consumedAt: now },
    }),
    prisma.otpCode.create({
      data: {
        phoneNumber: phone,
        codeHash: hashOtp(phone, otp),
        expiresAt,
      },
    }),
  ]);

  // The only delivery mechanism in this mock project.
  console.log(
    `[MiniLedger] Mock OTP for ${phone}: ${otp} ` +
      `(valid for ${env.OTP_TTL_MINUTES} minutes)`,
  );
}

/**
 * Verifies a login OTP and returns a signed JWT.
 *
 * The user row is created on first successful verification. Login requests do
 * not reveal whether a phone number already belongs to an account.
 */
export async function verifyLoginOtp(
  phone: string,
  otp: string,
): Promise<LoginResult> {
  const record = await prisma.otpCode.findFirst({
    where: {
      phoneNumber: phone,
      consumedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Same error for "not found" and "wrong code" to avoid leaking information.
  if (!record || !otpMatches(phone, otp, record.codeHash)) {
    throw new UnauthorizedError('Invalid or expired OTP.');
  }

  const user = await prisma.$transaction(async (tx) => {
    // Conditional update protects against two concurrent verifications of the
    // same code: only one can transition consumedAt from NULL to a timestamp.
    const claimed = await tx.otpCode.updateMany({
      where: { id: record.id, consumedAt: null },
      data: { consumedAt: new Date() },
    });

    if (claimed.count !== 1) {
      throw new UnauthorizedError('Invalid or expired OTP.');
    }

    return tx.user.upsert({
      where: { phoneNumber: phone },
      update: {},
      create: { phoneNumber: phone },
    });
  });

  return {
    token: signAccessToken(user),
    user: { id: user.id, phone: user.phoneNumber },
  };
}
