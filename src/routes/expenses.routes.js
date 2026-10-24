import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { 
  createExpense, 
  getExpensesByPhase, 
  deleteExpense, 
  exportExpensesCSV 
} from '../controllers/expenses.controller.js';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });
const router = Router();

router.get('/export/csv', exportExpensesCSV);
router.post('/', upload.single('invoice'), createExpense);
router.get('/phase/:phaseId', getExpensesByPhase);
router.delete('/:id', deleteExpense);

export default router;