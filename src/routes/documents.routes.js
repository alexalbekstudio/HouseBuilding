import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { getDocuments, createDocument, deleteDocument } from '../controllers/documents.controller.js';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `doc-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  }
});

const upload = multer({ storage });
const router = Router();

router.get('/', getDocuments);
router.post('/', upload.single('file'), createDocument);
router.delete('/:id', deleteDocument);

// GET /api/documents?projectId=1&onlyImages=true&phaseId=...
router.get('/', async (req, res) => {
  try {
    const projectId = req.query.projectId ? parseInt(req.query.projectId) : 1;
    const { phaseId, onlyImages } = req.query;

    const where = { projectId };

    if (phaseId && phaseId !== 'all') {
      where.phaseId = parseInt(phaseId);
    }

    if (onlyImages === 'true') {
      where.OR = [
        { fileUrl: { endsWith: '.jpg', mode: 'insensitive' } },
        { fileUrl: { endsWith: '.jpeg', mode: 'insensitive' } },
        { fileUrl: { endsWith: '.png', mode: 'insensitive' } },
        { fileUrl: { endsWith: '.webp', mode: 'insensitive' } }
      ];
    }

    const docs = await prisma.document.findMany({
      where,
      include: { phase: true },
      orderBy: { createdAt: 'desc' }
    });

    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;