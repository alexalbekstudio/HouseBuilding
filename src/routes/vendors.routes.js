import { Router } from 'express';
import { getAllVendors, createVendor } from '../controllers/vendors.controller.js';

const router = Router();

router.get('/', getAllVendors);
router.post('/', createVendor);

export default router;