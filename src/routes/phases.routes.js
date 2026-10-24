import { Router } from 'express';
import { getAllPhases, createPhase, updatePhase, deletePhase } from '../controllers/phases.controller.js';

const router = Router();

router.get('/', getAllPhases);
router.post('/', createPhase);
router.put('/:id', updatePhase);
router.delete('/:id', deletePhase);

export default router;