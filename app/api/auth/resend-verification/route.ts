
import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { sql } from '@/lib/db';
import { appUrl, sendEmail } from '@/lib/mail';
import { randomToken, createEmailToken } from '@/lib/email-auth';
import { HttpError, bodyJson, audit } from '@/lib/security';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const db = sql();
    const body = await bodyJson(req);
    const login = String(body.login || '').trim();
    const password = String(body.password || '');

    if (!login || !password) {
      throw new HttpError(400, 'Введи никнейм/email и пароль');
    }

    const users = await db`
      SELECT id, username, email, password_hash,
             is_banned, email_verified_at
      FROM users
      WHERE lower(email) = lower(${login})
         OR lower(username) = lower(${login})
      LIMIT 1
    `;

    if (!users.length ||
        !await bcrypt.compare(password, users[0].password_hash)) {
      throw new HttpError(401, 'Неверный логин или пароль');
    }

    const user = users[0];

    if (user.is_banned) {
      throw new HttpError(403, 'Аккаунт заблокирован');
    }

    if (user.email_verified_at) {
      return Response.json({
        ok: true,
        message: 'Email уже подтверждён. Попробуй войти.'
      });
    }

    const recent = await db`
      SELECT COUNT(*)::int AS count
      FROM email_auth_tokens
      WHERE user_id = ${user.id}
        AND purpose = 'verify_email'
        AND created_at > NOW() - INTERVAL '15 minutes'
    `;

    if (Number(recent[0]?.count || 0) >= 3) {
      throw new HttpError(
        429,
        'Письмо уже запрашивалось несколько раз. Подожди 15 минут.'
      );
    }

    const token = randomToken();
    await createEmailToken(String(user.id), 'verify_email', token, 60);

    const link = appUrl('/verify-email') +
      '?token=' + encodeURIComponent(token);

    try {
      await sendEmail(
        user.email,
        'Подтверждение email — Hypego',
        `Здравствуйте, ${user.username}!
Подтвердите email по ссылке: ${link}
Ссылка действует 60 минут.`,
        `<p>Здравствуйте, ${user.username}!</p>
         <p>Подтвердите email для аккаунта Hypego:</p>
         <p><a href="${link}">Подтвердить email</a></p>
         <p>Ссылка действует 60 минут.</p>`
      );
    } catch (error) {
      console.error('Resend verification email failed:', { message: (error as any)?.message, code: (error as any)?.code, command: (error as any)?.command, responseCode: (error as any)?.responseCode });
      throw new HttpError(
        503,
        'Не удалось отправить письмо. Проверь настройки SMTP в Vercel.'
      );
    }

    await audit(
      user.id,
      'auth.verification_resent',
      'user',
      user.id
    );

    return Response.json({
      ok: true,
      message: 'Письмо отправлено. Проверь входящие и папку «Спам».'
    });
  } catch (error) {
    const e = error as any;
    return Response.json(
      { error: e?.message || 'Внутренняя ошибка сервера' },
      { status: e?.status || 500 }
    );
  }
}

