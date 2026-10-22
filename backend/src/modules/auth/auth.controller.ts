import type { RequestHandler } from 'express';
import type { RequestOtpInput, VerifyOtpInput } from './auth.schemas';
import { requestLoginOtp, verifyLoginOtp } from './auth.service';

/**
 * Controllers stay thin: validate/parse in middleware, do the work in the
 * service, and shape the HTTP response here.
 */
export const requestOtpHandler: RequestHandler<
  Record<string, never>,
  unknown,
  RequestOtpInput
> = async (req, res) => {
  await requestLoginOtp(req.body.phone);

  res.status(200).json({
    message:
      'OTP generated. Check the server console — no real SMS was sent.',
  });
};

export const verifyOtpHandler: RequestHandler<
  Record<string, never>,
  unknown,
  VerifyOtpInput
> = async (req, res) => {
  const result = await verifyLoginOtp(req.body.phone, req.body.otp);
  res.status(200).json(result);
};
