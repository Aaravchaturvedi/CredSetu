import { Router } from 'express';
import { validateBody } from '../../middleware/validate';
import { requestOtpHandler, verifyOtpHandler } from './auth.controller';
import { requestOtpSchema, verifyOtpSchema } from './auth.schemas';

export const authRouter = Router();

authRouter.post('/login', validateBody(requestOtpSchema), requestOtpHandler);
authRouter.post('/verify', validateBody(verifyOtpSchema), verifyOtpHandler);
