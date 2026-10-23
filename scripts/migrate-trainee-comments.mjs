import { neon } from '@neondatabase/serverless';
import { readFile } from 'node:fs/promises';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL отсутствует в окружении');
}

const sql = neon(process.env.DATABASE_URL);
const file = await readFile(
  new URL('../migration-trainee-comments.sql', import.meta.url),
  'utf8'
);

const statements = file.split(';').map(s => s.trim()).filter(Boolean);

if (
  statements.length !== 2 ||
  !statements[0].includes('CREATE TABLE IF NOT EXISTS trainee_application_messages') ||
  !statements[1].includes('trainee_application_messages_order_idx')
) {
  throw new Error('Проверка миграции не пройдена. База не изменена.');
}

for (const statement of statements) {
  await sql.query(statement, []);
}

const columns = await sql`
  SELECT column_name
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'trainee_application_messages'
  ORDER BY ordinal_position
`;

console.log('Миграция выполнена. Колонки:');
console.log(columns.map(row => row.column_name).join(', '));
