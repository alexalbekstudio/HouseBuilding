import nodemailer from 'nodemailer';
import cron from 'node-cron';
import prisma from '../config/db.js';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

/**
 * Provjerava podsjetnike koji ističu u naredna 3 dana ili danas
 */
export async function checkAndSendReminderEmails() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const inThreeDays = new Date(today);
    inThreeDays.setDate(inThreeDays.getDate() + 3);
    inThreeDays.setHours(23, 59, 59, 999);

    // Dohvati sve nedovršene podsjetnike koji dospijevaju u tom periodu
    const reminders = await prisma.reminder.findMany({
      where: {
        isCompleted: false,
        dueDate: {
          gte: today,
          lte: inThreeDays
        }
      },
      include: {
        project: {
          include: {
            user: true
          }
        }
      }
    });

    if (reminders.length === 0) return;

    for (const rem of reminders) {
      const recipientEmail = rem.project?.user?.email;
      if (!recipientEmail) continue;

      const dueDateFormatted = new Date(rem.dueDate).toLocaleDateString('sr-RS');
      const isUrgent = rem.priority === 'HIGH' || rem.priority === 'CRITICAL';

      const mailOptions = {
        from: process.env.EMAIL_FROM || 'HouseBuilding <noreply@housebuilding.app>',
        to: recipientEmail,
        subject: `⚠️ ${isUrgent ? '[HITNO] ' : ''}Podsetnik za gradilište: ${rem.title}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #f8fafc;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h2 style="color: #0f172a; margin: 0;">🏠 HouseBuilding SaaS</h2>
              <p style="color: #64748b; font-size: 13px; margin-top: 4px;">Obavještenje o zakonskim i ugovorenim obavezama</p>
            </div>
            
            <div style="background-color: #ffffff; padding: 18px; border-radius: 8px; border-left: 5px solid ${isUrgent ? '#ef4444' : '#3b82f6'};">
              <h3 style="margin-top: 0; color: #1e293b;">${rem.title}</h3>
              <p style="font-size: 14px; color: #475569; margin: 6px 0;"><strong>Gradilište:</strong> ${rem.project?.name || 'Glavni projekat'}</p>
              <p style="font-size: 14px; color: #475569; margin: 6px 0;"><strong>Rok za izvršenje:</strong> <span style="color: #dc2626; font-weight: bold;">${dueDateFormatted}</span></p>
              <p style="font-size: 14px; color: #475569; margin: 6px 0;"><strong>Prioritet:</strong> ${rem.priority || 'Normalan'}</p>
              ${rem.description ? `<p style="font-size: 13px; color: #64748b; margin-top: 10px;"><em>Opis:</em> ${rem.description}</p>` : ''}
            </div>

            <div style="text-align: center; margin-top: 25px;">
              <a href="${process.env.APP_URL || 'http://localhost:3000'}" style="background-color: #2563eb; color: #ffffff; padding: 10px 22px; text-decoration: none; font-weight: bold; font-size: 13px; border-radius: 6px; display: inline-block;">
                Otvori aplikaciju i označi kao riješeno
              </a>
            </div>

            <p style="font-size: 11px; color: #94a3b8; text-align: center; margin-top: 25px;">
              © 2026 ALEXANDAR Studio • Automatski servis za obavještavanje investitora
            </p>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
    }
  } catch (err) {
    console.error('Greška pri slanju email obavještenja za podsjetnike:', err);
  }
}

/**
 * Pokretanje automatskog zadatka svakog dana u 08:00 ujutru
 */
export function initReminderScheduler() {
  cron.schedule('0 8 * * *', async () => {
    await checkAndSendReminderEmails();
  });
}