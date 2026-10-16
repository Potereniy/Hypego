import nodemailer from 'nodemailer';

export function appUrl(path: string) {
  const base = process.env.APP_URL;
  if (!base) throw new Error('APP_URL не настроен');
  return new URL(path, base.endsWith('/') ? base : base + '/').toString();
}

function emailLayout(content: string, subject: string) {
  const safeSubject = subject
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="dark">
  <title>${safeSubject}</title>
</head>
<body style="margin:0;padding:0;background-color:#080b14;font-family:Arial,Helvetica,sans-serif;color:#e8eaf5;">
  <div style="display:none;font-size:1px;color:#080b14;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
    HYPEGO — игровой мир начинается здесь.
  </div>

  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
    style="background-color:#080b14;width:100%;">
    <tr>
      <td align="center" style="padding:36px 14px;">
        <table role="presentation" width="560" cellspacing="0" cellpadding="0" border="0"
          style="width:100%;max-width:560px;border-collapse:separate;border-spacing:0;">

          <tr>
            <td align="center" style="padding:8px 0 28px;">
              <div style="font-size:30px;line-height:36px;font-weight:900;letter-spacing:4px;color:#ffffff;">
                HYPE<span style="color:#9b72ff;">GO</span>
              </div>
              <div style="padding-top:8px;font-size:11px;letter-spacing:3px;color:#858ba7;">
                YOUR GAME. YOUR WORLD.
              </div>
            </td>
          </tr>

          <tr>
            <td style="padding:1px;border-radius:18px;background-color:#6545d8;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
                style="width:100%;background-color:#111626;border-radius:17px;">
                <tr>
                  <td style="padding:34px 28px 30px;">
                    <div style="height:3px;width:54px;background-color:#9b72ff;border-radius:4px;margin-bottom:24px;"></div>

                    <div style="font-size:23px;line-height:31px;font-weight:700;color:#ffffff;margin-bottom:20px;">
                      ${safeSubject}
                    </div>

                    <div style="font-size:15px;line-height:1.8;color:#c7cce0;overflow-wrap:anywhere;">
                      ${content}
                    </div>

                    <div style="margin-top:28px;padding-top:20px;border-top:1px solid #292e43;font-size:12px;line-height:1.7;color:#858ba7;">
                      Это автоматическое сообщение HYPEGO. Если вы не выполняли это действие, просто проигнорируйте письмо, если в нём не указано иное.
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding:24px 10px 0;font-size:12px;line-height:1.8;color:#707790;">
              HYPEGO © ${new Date().getFullYear()}<br>
              Играй. Общайся. Создавай своё.
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

  <style>
    a {
      display: inline-block !important;
      margin: 8px 0 !important;
      padding: 13px 22px !important;
      border-radius: 9px !important;
      background-color: #8057ed !important;
      color: #ffffff !important;
      font-weight: 700 !important;
      text-decoration: none !important;
      line-height: 1.4 !important;
    }
    h2 {
      display: inline-block !important;
      padding: 12px 20px !important;
      border: 1px solid #6545d8 !important;
      border-radius: 10px !important;
      background-color: #1b2035 !important;
      color: #bda5ff !important;
      font-size: 28px !important;
      letter-spacing: 6px !important;
    }
    p {
      margin: 0 0 16px !important;
    }
  </style>
</body>
</html>`;
}

export async function sendEmail(
  to: string,
  subject: string,
  text: string,
  html: string
) {
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

  await transporter.sendMail({
    from,
    to,
    subject,
    text,
    html: emailLayout(html, subject),
  });
}
