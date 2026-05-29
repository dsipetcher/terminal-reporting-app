import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const UPLOADS_ROOT = path.join(__dirname, '..', '..', 'uploads', 'logistics-orders');

export const ORDER_DOCUMENT_TYPES = [
  'CONTRACT',
  'INVOICE',
  'WAYBILL',
  'CERTIFICATE',
  'CUSTOMS',
  'OTHER',
] as const;

export function orderUploadsDir(orderId: number): string {
  return path.join(UPLOADS_ROOT, String(orderId));
}

export function ensureUploadsDir(orderId: number): void {
  fs.mkdirSync(orderUploadsDir(orderId), { recursive: true });
}

export function deleteOrderUploads(orderId: number): void {
  const dir = orderUploadsDir(orderId);
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

export function documentAbsolutePath(orderId: number, storedName: string): string {
  return path.join(orderUploadsDir(orderId), storedName);
}

export function deleteDocumentFile(orderId: number, storedName: string): void {
  const full = documentAbsolutePath(orderId, storedName);
  if (fs.existsSync(full)) {
    fs.unlinkSync(full);
  }
}

const ALLOWED_MIME = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
]);

export const uploadOrderDocument = multer({
  storage: multer.diskStorage({
    destination: (req, _file, cb) => {
      const orderId = Number(req.params.orderId);
      ensureUploadsDir(orderId);
      cb(null, orderUploadsDir(orderId));
    },
    filename: (_req, file, cb) => {
      const safe = file.originalname.replace(/[^\w.\-()а-яА-ЯёЁ\s]/g, '_');
      cb(null, `${Date.now()}-${safe}`);
    },
  }),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME.has(file.mimetype) || file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Неподдерживаемый тип файла'));
    }
  },
});
