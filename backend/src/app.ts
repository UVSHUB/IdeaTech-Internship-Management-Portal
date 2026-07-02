import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

import apiRoutes from './routes';

const app = express();
const PORT = process.env.PORT || 5000;

// Security Middlewares
app.use(helmet({
  crossOriginResourcePolicy: false, // Allow static downloads across origins
}));
app.use(cors({
  origin: '*', // In production, replace with specific frontend URL
  credentials: true,
}));

// Rate Limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per windowMs
  message: { message: 'Too many requests from this IP, please try again later.' }
});
app.use('/api/', limiter);

// Request parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure upload folders exist
const uploadsDir = path.join(__dirname, '../../uploads');
const subfolders = ['cv', 'screenshots', 'attachments', 'leaves', 'idcards', 'certificates'];
subfolders.forEach(folder => {
  const folderPath = path.join(uploadsDir, folder);
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }
});

// Serve uploads as static assets
app.use('/uploads', express.static(uploadsDir));

// API Routes
app.use('/api', apiRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'API Route not found.' });
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 ITIMP Backend running on port ${PORT}`);
  console.log(`📂 Uploads directory mapped: ${uploadsDir}`);
});

export default app;
