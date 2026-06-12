import { join } from 'path';

// Where uploaded files live on disk and how they're exposed over HTTP.
// Kept in one place so the controller, static-asset serving (main.ts) and the
// URL builder all agree.
export const UPLOAD_DIR = join(process.cwd(), 'uploads');
export const UPLOAD_ROUTE = '/uploads';

// Local-only storage for now; production would swap this for S3 + CDN
// (see PRD §13 Skalabilitas).
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB

export const ALLOWED_IMAGE_MIME = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];
