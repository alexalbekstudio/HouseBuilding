import { Router } from 'express';
import { getMaterials, createMaterial, deleteMaterial } from '../controllers/materials.controller.js';

const router = Router();
router.get('/', getMaterials);
router.post('/', createMaterial);
router.delete('/:id', deleteMaterial);

export default router;