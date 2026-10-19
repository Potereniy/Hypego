import { neon } from '@neondatabase/serverless';
import { readFile } from 'node:fs/promises';

if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL отсутствует. Загрузи переменную окружения, не выводя её значение.'
  );
}

const db = neon(process.env.DATABASE_URL);
const file = await readFile(
  new URL('../migration-support-tickets.sql', import.meta.url),
  'utf8'
);

const statements = file.split(';').map(s => s.trim()).filter(Boolean);

const expected = [
  'ALTER TABLE tickets',
  'ALTER TABLE tickets',
  'ALTER TABLE tickets',
  'CREATE TABLE IF NOT EXISTS ticket_messages',
  'CREATE INDEX IF NOT EXISTS ticket_messages_thread_idx',
  'CREATE INDEX IF NOT EXISTS tickets_status_updated_idx',
  'CREATE INDEX IF NOT EXISTS tickets_assigned_idx',
  'DELETE FROM role_permissions'
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
  SELECT
    to_regclass('public.ticket_messages') AS messages_table,
    EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'tickets'
        AND column_name = 'assigned_to'
    ) AS has_assignment
`;

if (!result[0]?.messages_table || !result[0]?.has_assignment) {
  throw new Error('Проверка не пройдена: структура тикетов неполная.');
}

console.log('УСПЕХ: миграция техподдержки применена.');
