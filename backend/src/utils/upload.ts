import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Configure Disk Storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let subfolder = 'others';
    if (file.fieldname === 'cv') {
      subfolder = 'cv';
    } else if (file.fieldname === 'screenshot') {
      subfolder = 'screenshots';
    } else if (file.fieldname === 'attachment') {
      subfolder = 'attachments';
    } else if (file.fieldname === 'document') {
      subfolder = 'leaves';
    }

    const uploadPath = path.join(__dirname, `../../../uploads/${subfolder}`);
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

// File filters
const fileFilter = (req: any, file: Express.Multer.File | any, cb: any) => {
  const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.zip', '.doc', '.docx'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, images, ZIP, and Word docs are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// CVs are uploaded to Supabase Storage, so keep the file in memory instead of writing to disk
export const uploadCv = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

export default upload;
