import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { readFile } from 'node:fs/promises';

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL не настроен. Миграция не запускалась.');
  process.exit(1);
}

const db = neon(process.env.DATABASE_URL);

const sql = await readFile(
  new URL(
    '../migrations/20261022_global_chat_moderation.sql',
    import.meta.url
  ),
  'utf8'
);

const statements = sql
  .split(';')
  .map((s) => s.trim())
  .filter(Boolean);

for (let i = 0; i < statements.length; i++) {
  try {
    await db.query(statements[i], []);
    console.log(`SQL ${i + 1}/${statements.length}: OK`);
  } catch (error) {
    console.error(
      `Ошибка миграции, SQL #${i + 1}:`,
      error instanceof Error ? error.message : error
    );
    process.exit(1);
  }
}

const result = await db`
  SELECT
    to_regclass('public.global_chat_messages') AS messages_table,
    to_regclass('public.global_chat_bans') AS bans_table
`;

if (!result[0]?.messages_table) {
  console.error('Таблица global_chat_messages не найдена.');
  process.exit(1);
}

if (!result[0]?.bans_table) {
  console.error('Таблица global_chat_bans не найдена.');
  process.exit(1);
}

const permission = await db`
  SELECT id
  FROM permissions
  WHERE id = 'global_chat.moderate'
  LIMIT 1
`;

if (!permission.length) {
  console.error('Permission global_chat.moderate не создан.');
  process.exit(1);
}

console.log('УСПЕХ: модерация общего чата создана в Neon.');
