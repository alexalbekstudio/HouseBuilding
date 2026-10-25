import { Router } from 'express';
import { getAllPhases, updatePhaseStatus } from '../controllers/phases.controller.js';

const router = Router();

router.get('/', getAllPhases);
router.put('/:id', updatePhaseStatus);

export default router;