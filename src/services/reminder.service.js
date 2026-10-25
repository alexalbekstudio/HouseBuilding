import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { sendMail } from './email.service.js';

const prisma = new PrismaClient();

/**
 * Pokreće cron posao koji svakog jutra u 08:00 proverava rokove faza gradnje
 */
export function initReminderCron() {
  // Svakog dana u 08:00 AM ('0 8 * * *')
  // Za brzo testiranje možete privremeno staviti npr. '* * * * *' (svaki minut)
  cron.schedule('0 8 * * *', async () => {
    console.log('[CRON] Provera rokova faza gradnje...');
    try {
      await checkUpcomingDeadlines();
    } catch (err) {
      console.error('[CRON GREŠKA] Neuspešna provera rokova:', err);
    }
  });
}

/**
 * Logika za analizu rokova i slanje obaveštenja
 */
export async function checkUpcomingDeadlines() {
  const now = new Date();
  const threeDaysFromNow = new Date();
  threeDaysFromNow.setDate(now.getDate() + 3);

  // Dohvati sve aktivne faze koje imaju postavljen rok i nisu završene
  const activePhases = await prisma.phase.findMany({
    where: {
      status: { not: 'ZAVRSENO' },
      endDate: { not: null }
    },
    include: {
      project: {
        include: { user: true }
      }
    }
  });

  for (const phase of activePhases) {
    const deadline = new Date(phase.endDate);
    const diffTime = deadline - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const recipientEmail = phase.project?.user?.email || process.env.ADMIN_EMAIL || process.env.SMTP_USER;

    // Ako rok ističe za tačno 3 dana ili je probijen (diffDays <= 0)
    if (diffDays <= 3 && recipientEmail) {
      const isOverdue = diffDays < 0;
      const subject = isOverdue
        ? `⚠️ [HouseBuilding] Prekoračen rok: ${phase.title}`
        : `⏳ [HouseBuilding] Rok ističe uskoro: ${phase.title}`;

      const statusText = isOverdue
        ? `<strong style="color: #e11d48;">Rok je istekao pre ${Math.abs(diffDays)} dana!</strong>`
        : `<strong style="color: #d97706;">Preostalo je još ${diffDays} dana do roka.</strong>`;

      await sendMail({
        to: recipientEmail,
        subject,
        text: `Podsetnik za gradilište: Faza "${phase.title}" (Gradilište: ${phase.project.name}). ${isOverdue ? 'Rok je prekoračen!' : 'Rok ističe uskoro!'}`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f8fafc; border-radius: 12px; color: #1e293b;">
            <h2 style="color: #2563eb; margin-top: 0;">🏠 HouseBuilding Podsetnik</h2>
            <p>Obaveštenje za gradilište: <strong>${phase.project.name}</strong></p>
            <div style="background: #ffffff; padding: 16px; border: 1px solid #e2e8f0; border-radius: 8px; margin: 15px 0;">
              <h3 style="margin-top: 0; font-size: 16px; color: #0f172a;">${phase.orderIndex}. ${phase.title}</h3>
              <p style="font-size: 13px; margin: 6px 0;">Planirani završetak: <strong>${deadline.toLocaleDateString('sr-RS')}</strong></p>
              <p style="font-size: 13px; margin: 6px 0;">${statusText}</p>
            </div>
            <p style="font-size: 12px; color: #64748b;">Prijavite se na aplikaciju da ažurirate status faze ili produžite rok.</p>
          </div>
        `
      });
      console.log(`[CRON] Poslat podsetnik za fazu "${phase.title}" na: ${recipientEmail}`);
    }
  }
}