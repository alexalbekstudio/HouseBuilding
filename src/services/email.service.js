import nodemailer from 'nodemailer';

// Konfiguracija SMTP transportera iz .env promenljivih
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true', // true za port 465, false za 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS // Ako je Gmail, koristi se 16-cifrena App Password
  }
});

/**
 * Pomoćna funkcija za slanje email obaveštenja
 * @param {Object} options - { to, subject, text, html }
 */
export async function sendMail({ to, subject, text, html }) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error('SMTP kredencijali nisu postavljeni u .env fajlu (SMTP_USER / SMTP_PASS).');
  }

  const mailOptions = {
    from: `"HouseBuilding Obaveštenja" <${process.env.SMTP_USER}>`,
    to,
    subject,
    text,
    html
  };

  return await transporter.sendMail(mailOptions);
}

export default { sendMail };