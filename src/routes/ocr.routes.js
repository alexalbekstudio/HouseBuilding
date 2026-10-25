import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { scanReceipt } from '../controllers/ocr.controller.js';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `ocr-${Date.now()}${ext}`);
  }
});

const upload = multer({ storage });
const router = Router();

router.post('/scan', upload.single('receipt'), scanReceipt);

export default router;