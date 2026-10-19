import { neon } from '@neondatabase/serverless';
import { readFile } from 'node:fs/promises';

if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL отсутствует. Проверь переменные окружения, не выводя их содержимое.'
  );
}

const db = neon(process.env.DATABASE_URL);
const file = await readFile(
  new URL('../migration-punishment-evidence.sql', import.meta.url),
  'utf8'
);

const statements = file
  .split(';')
  .map((statement) => statement.trim())
  .filter(Boolean);

const expected = [
  'CREATE TABLE IF NOT EXISTS punishment_evidence',
  'CREATE INDEX IF NOT EXISTS punishment_evidence_punishment_id_idx'
];

if (
  statements.length !== expected.length ||
  !statements.every((statement, index) =>
    statement.toLowerCase().includes(expected[index].toLowerCase())
  )
) {
  throw new Error('Проверка миграции не пройдена. База не изменена.');
}

const existing = await db`
  SELECT to_regclass('public.punishments') AS table_name
`;

if (!existing[0]?.table_name) {
  throw new Error(
    'Таблица punishments не найдена. Сначала проверь подключение к нужной базе.'
  );
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
  SELECT to_regclass('public.punishment_evidence') AS table_name
`;

if (!result[0]?.table_name) {
  throw new Error('Проверка не пройдена: таблица не найдена.');
}

console.log('УСПЕХ: таблица punishment_evidence создана.');
