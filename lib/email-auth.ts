import { createHash, createHmac, randomBytes } from 'node:crypto';
import { cookies } from 'next/headers';
import { sql } from '@/lib/db';

export type EmailTokenPurpose =
  | 'verify_email'
  | 'password_reset'
  | 'login_code';

export function randomToken() {
  return randomBytes(32).toString('hex');
}

export function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

export function hashCode(code: string) {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('AUTH_SECRET должен содержать минимум 32 символа');
  }
  return createHmac('sha256', secret).update(code).digest('hex');
}

export function hashUserAgent(userAgent: string) {
  return hashToken(userAgent.slice(0, 1000));
}

export async function createEmailToken(
  userId: string,
  purpose: EmailTokenPurpose,
  token: string,
  expiresMinutes: number,
) {
  const db = sql();
  await db`
    UPDATE email_auth_tokens
    SET consumed_at = NOW()
    WHERE user_id = ${userId}
      AND purpose = ${purpose}
      AND consumed_at IS NULL
  `;

  await db`
    INSERT INTO email_auth_tokens
      (user_id, purpose, token_hash, expires_at)
    VALUES (
      ${userId},
      ${purpose},
      ${hashToken(token)},
      NOW() + (${expiresMinutes} * INTERVAL '1 minute')
    )
  `;
}

export async function createLoginCode(
  userId: string,
  code: string,
) {
  const db = sql();

  const recent = await db`
    SELECT COUNT(*)::int AS count
    FROM email_auth_tokens
    WHERE user_id = ${userId}
      AND purpose = 'login_code'
      AND created_at > NOW() - INTERVAL '1 hour'
  `;

  if (Number(recent[0]?.count || 0) >= 5) {
    throw new Error('Слишком много попыток входа. Попробуйте через час.');
  }

  await db`
    UPDATE email_auth_tokens
    SET consumed_at = NOW()
    WHERE user_id = ${userId}
      AND purpose = 'login_code'
      AND consumed_at IS NULL
  `;

  await db`
    INSERT INTO email_auth_tokens
      (user_id, purpose, token_hash, expires_at)
    VALUES (
      ${userId},
      'login_code',
      ${hashCode(code)},
      NOW() + INTERVAL '10 minutes'
    )
  `;
}

export async function isTrustedDevice(
  userId: string,
  token: string | undefined,
  userAgent: string,
) {
  if (!token) return false;

  const db = sql();
  const rows = await db`
    SELECT id
    FROM trusted_devices
    WHERE user_id = ${userId}
      AND token_hash = ${hashToken(token)}
      AND user_agent_hash = ${hashUserAgent(userAgent)}
      AND revoked_at IS NULL
      AND expires_at > NOW()
    LIMIT 1
  `;

  if (!rows.length) return false;

  await db`
    UPDATE trusted_devices
    SET last_used_at = NOW()
    WHERE id = ${rows[0].id}
  `;

  return true;
}

export async function trustDevice(
  userId: string,
  userAgent: string,
) {
  const token = randomToken();
  const db = sql();

  await db`
    INSERT INTO trusted_devices
      (user_id, token_hash, user_agent_hash, expires_at)
    VALUES (
      ${userId},
      ${hashToken(token)},
      ${hashUserAgent(userAgent)},
      NOW() + INTERVAL '30 days'
    )
  `;

  const cookieStore = await cookies();
  cookieStore.set('hypego_device', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearTrustedDeviceCookie() {
  const cookieStore = await cookies();
  cookieStore.set('hypego_device', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}
