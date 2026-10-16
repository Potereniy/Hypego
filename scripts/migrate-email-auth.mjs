import fs from 'node:fs';
import { neon } from '@neondatabase/serverless';

if (fs.existsSync('.env')) {
  for (const line of fs.readFileSync('.env', 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (match && !process.env[match[1]]) {
      let value = match[2].trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) value = value.slice(1, -1);
      process.env[match[1]] = value;
    }
  }
}

if (!process.env.DATABASE_URL) {
  console.error('Ошибка: DATABASE_URL не найден в .env');
  process.exit(1);
}

const db = neon(process.env.DATABASE_URL);

const columns = await db`
  SELECT column_name
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'users'
    AND column_name = 'email_verified_at'
`;

if (columns.length === 0) {
  await db`ALTER TABLE users ADD COLUMN email_verified_at TIMESTAMPTZ`;
  // Существующие аккаунты сохраняют доступ; новые регистрации будут требовать подтверждения.
  await db`UPDATE users SET email_verified_at = COALESCE(created_at, NOW()) WHERE email_verified_at IS NULL`;
  console.log('Добавлен email_verified_at; существующие аккаунты сохранены.');
} else {
  console.log('email_verified_at уже существует; существующие значения не изменены.');
}

await db`ALTER TABLE users ADD COLUMN IF NOT EXISTS session_version INTEGER NOT NULL DEFAULT 0`;

await db`
  CREATE TABLE IF NOT EXISTS email_auth_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    purpose TEXT NOT NULL CHECK (purpose IN ('verify_email','password_reset','login_code')),
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    consumed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`;

await db`
  CREATE INDEX IF NOT EXISTS email_auth_tokens_user_purpose_idx
  ON email_auth_tokens(user_id, purpose, created_at DESC)
`;

await db`
  CREATE TABLE IF NOT EXISTS trusted_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    user_agent_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ
  )
`;

await db`
  CREATE INDEX IF NOT EXISTS trusted_devices_user_idx
  ON trusted_devices(user_id, expires_at)
`;

console.log('Миграция email-авторизации завершена.');
