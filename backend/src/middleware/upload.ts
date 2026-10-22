import { randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import multer from 'multer';
import { env } from '../config/env';
import { BadRequestError } from '../utils/errors';

/**
 * Receipt images are stored on local disk for this mini project. In production
 * this would normally be S3/GCS with signed URLs, malware scanning, and a
 * lifecycle policy for orphaned uploads.
 */
const uploadDirectory = path.resolve(process.cwd(), env.UPLOAD_DIR);
mkdirSync(uploadDirectory, { recursive: true });

const EXTENSION_BY_MIME: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, uploadDirectory);
  },
  filename: (_req, file, callback) => {
    // Never trust the client's filename. A random UUID also makes the public
    // URL unguessable, which is useful because the static directory is public.
    const extension = EXTENSION_BY_MIME[file.mimetype] ?? '';
    callback(null, `${randomUUID()}${extension}`);
  },
});

/**
 * Multer middleware for a single multipart file in the `receipt` field.
 * Limits: one file, 5 MB, JPEG/PNG/WebP only.
 */
export const uploadReceipt = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },
  fileFilter: (_req, file, callback) => {
    if (!EXTENSION_BY_MIME[file.mimetype]) {
      callback(
        new BadRequestError(
          'Receipt must be a JPEG, PNG, or WebP image.',
          'INVALID_FILE_TYPE',
        ),
      );
      return;
    }
    callback(null, true);
  },
}).single('receipt');
