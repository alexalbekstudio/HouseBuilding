import { Router } from 'express';
import { getCapitals, createCapital, deleteCapital } from '../controllers/capitals.controller.js';

const router = Router();
router.get('/', getCapitals);
router.post('/', createCapital);
router.delete('/:id', deleteCapital);

export default router;