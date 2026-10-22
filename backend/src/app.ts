import path from 'node:path';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env';
import { errorHandler, notFoundHandler } from './middleware/error-handler';
import { authRouter } from './modules/auth/auth.routes';
import { loanRouter } from './modules/loans/loan.routes';
import { uploadRouter } from './modules/uploads/upload.routes';

/**
 * Builds the Express application without binding a port. Exporting a factory
 * lets tests create isolated app instances with supertest while `server.ts`
 * remains responsible for actually listening.
 */
export function createApp() {
  const app = express();

  app.disable('x-powered-by');

  // crossOriginResourcePolicy is relaxed so Expo Web (and other origins) can
  // display uploaded receipt images. APIs still have CORS enabled below.
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.use(cors());
  app.use(express.json({ limit: '1mb' }));

  // Request logs are useful locally but noisy in automated test output.
  if (env.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
  }

  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  app.use('/auth', authRouter);
  app.use('/loans', loanRouter);

  // POST /uploads/receipt must be registered before the static GET handler.
  app.use('/uploads', uploadRouter);
  app.use(
    '/uploads',
    express.static(path.resolve(process.cwd(), env.UPLOAD_DIR), {
      maxAge: '1d',
      immutable: true,
    }),
  );

  // Order matters: unmatched routes become a 404 AppError, then the error
  // boundary converts every failure into the same JSON shape.
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export const app = createApp();
