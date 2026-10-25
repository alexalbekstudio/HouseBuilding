import { Router } from 'express';
import { getAllSubscribers, updateSubscription } from '../controllers/admin.controller.js';
import { authenticate, requireAdmin } from '../middleware/auth.middleware.js';
import { sendMail } from '../services/email.service.js';

const router = Router();
router.get('/subscribers', authenticate, requireAdmin, getAllSubscribers);
router.put('/subscribers/:userId', authenticate, requireAdmin, updateSubscription);

router.post('/test-email', async (req, res) => {
  try {
    const userEmail = req.user?.email || process.env.ADMIN_EMAIL || process.env.SMTP_USER;

    await sendMail({
      to: userEmail,
      subject: 'HouseBuilding — Test obavijest sistema',
      text: 'Ovo je probna poruka. Email servis i obavijesti za gradilište rade ispravno!',
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #1e293b;">
          <h2 style="color: #2563eb;">HouseBuilding SaaS</h2>
          <p>Pozdrav, ovo je potvrda da je <strong>Email servis uspješno konfiguriran</strong>.</p>
          <p>Automatski podsjetnici za rokove i građevinski dnevnik će uredno stizati na ovu adresu.</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <small style="color: #64748b;">Lokacija: Melenci | Datum: ${new Date().toLocaleDateString('sr-RS')}</small>
        </div>
      `
    });
    res.json({ success: true, message: `Testni email uspješno poslan na: ${userEmail}` });
  } catch (error) {
    console.error('Greška pri slanju probnog emaila:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;