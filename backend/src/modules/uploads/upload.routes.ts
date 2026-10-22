import { Router } from 'express';
import type { RequestHandler } from 'express';
import { env } from '../../config/env';
import { authenticate } from '../../middleware/authenticate';
import { uploadReceipt } from '../../middleware/upload';
import { BadRequestError } from '../../utils/errors';

const uploadReceiptHandler: RequestHandler = (req, res) => {
  if (!req.file) {
    throw new BadRequestError(
      'No image was uploaded. Send multipart/form-data with a file field named "receipt".',
      'MISSING_FILE',
    );
  }

  const baseUrl = env.PUBLIC_BASE_URL.replace(/\/+$/, '');
  res.status(201).json({
    receiptImageUrl: `${baseUrl}/uploads/${req.file.filename}`,
  });
};

export const uploadRouter = Router();

// Auth runs before multer so unauthenticated requests never write to disk.
uploadRouter.post(
  '/receipt',
  authenticate,
  uploadReceipt,
  uploadReceiptHandler,
);
