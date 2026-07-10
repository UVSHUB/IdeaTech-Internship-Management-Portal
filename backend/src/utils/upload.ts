import multer from 'multer';
import path from 'path';

// File filter: restrict to a safe set of document/image types
const fileFilter = (req: any, file: Express.Multer.File | any, cb: any) => {
  const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.zip', '.doc', '.docx'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, images, ZIP, and Word docs are allowed.'), false);
  }
};

// All uploads are held in memory and streamed to Supabase Storage (Vercel-compatible; no local disk).
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// CVs use the same in-memory strategy; kept as a named export for existing imports.
export const uploadCv = upload;

export default upload;
