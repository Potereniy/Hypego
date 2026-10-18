import { neon } from '@neondatabase/serverless';
import { readFile } from 'node:fs/promises';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL отсутствует. Проверь .env, не выводя его содержимое.');
}

const db = neon(process.env.DATABASE_URL);
const file = await readFile(
  new URL('../migration-direct-messages.sql', import.meta.url),
  'utf8'
);
const statements = file.split(';').map(s => s.trim()).filter(Boolean);

const expected = [
  'CREATE TABLE IF NOT EXISTS direct_messages',
  'CREATE INDEX IF NOT EXISTS direct_messages_thread_idx',
  'CREATE INDEX IF NOT EXISTS direct_messages_unread_idx'
];

if (
  statements.length !== expected.length ||
  !statements.every((s, i) =>
    s.toLowerCase().includes(expected[i].toLowerCase())
  )
) {
  throw new Error('Проверка миграции не пройдена. База не изменена.');
}

for (let i = 0; i < statements.length; i++) {
  try {
    await db.query(statements[i], []);
    console.log(`SQL ${i + 1}/${statements.length}: OK`);
  } catch (error) {
    console.error(`Ошибка SQL #${i + 1}:`, error.message);
    throw error;
  }
}

const result = await db`
  SELECT to_regclass('public.direct_messages') AS table_name
`;

if (!result[0]?.table_name) {
  throw new Error('Проверка не пройдена: таблица не найдена.');
}

console.log('УСПЕХ: таблица direct_messages существует.');
