import { Router } from 'express';
import {
  getReminders,
  createReminder,
  toggleReminderStatus,
  deleteReminder,
  generateLegalReminders
} from '../controllers/reminders.controller.js';

const router = Router();

router.get('/', getReminders);
router.post('/', createReminder);
router.post('/generate-legal', generateLegalReminders);
router.patch('/:id/toggle', toggleReminderStatus);
router.delete('/:id', deleteReminder);

export default router;