import { neon } from '@neondatabase/serverless';
import { readFile } from 'node:fs/promises';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL отсутствует в .env');
}

const sql = neon(process.env.DATABASE_URL);
const file = await readFile(
  new URL('../migration-trainee-applications.sql', import.meta.url),
  'utf8'
);

const statements = file.split(';').map(s => s.trim()).filter(Boolean);

if (
  statements.length !== 3 ||
  !statements[0].includes('CREATE TABLE IF NOT EXISTS trainee_applications') ||
  !statements[1].includes('trainee_applications_one_pending_per_user') ||
  !statements[2].includes('trainee_applications_created_at_idx')
) {
  throw new Error('Проверка миграции не пройдена. База не изменена.');
}

for (let i = 0; i < statements.length; i++) {
  try {
    await sql.query(statements[i], []);
  } catch (error) {
    console.error(`Ошибка SQL #${i + 1}:`, error.message);
    throw error;
  }
}

const result = await sql`
  SELECT column_name
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'trainee_applications'
  ORDER BY ordinal_position
`;

console.log('Миграция выполнена. Колонки таблицы:');
console.log(result.map(row => row.column_name).join(', '));
