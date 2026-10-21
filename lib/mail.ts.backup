import nodemailer from 'nodemailer';

export function appUrl(path: string) {
  const base = process.env.APP_URL;
  if (!base) throw new Error('APP_URL не настроен');
  return new URL(path, base.endsWith('/') ? base : base + '/').toString();
}

export async function sendEmail(to: string, subject: string, text: string, html: string) {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 465);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_APP_PASSWORD;
  const from = process.env.SMTP_FROM || user;

  if (!host || !user || !pass || !from) {
    throw new Error('Настройки почты не заполнены в .env');
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: process.env.SMTP_SECURE
      ? process.env.SMTP_SECURE === 'true'
      : port === 465,
    auth: { user, pass },
  });

  await transporter.sendMail({ from, to, subject, text, html });
}
