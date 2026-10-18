import { neon } from '@neondatabase/serverless';
import { readFile } from 'node:fs/promises';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL отсутствует. Проверь .env, не выводя его содержимое.');
}

const db = neon(process.env.DATABASE_URL);
const file = await readFile(
  new URL('../migration-profile-effects.sql', import.meta.url),
  'utf8'
);

const statements = file.split(';').map(s => s.trim()).filter(Boolean);

const expected = [
  'ALTER TABLE users',
  'ALTER TABLE users',
  'ALTER TABLE users',
  'ALTER TABLE users',
  'ALTER TABLE users',
  'ALTER TABLE users'
];

if (
  statements.length !== expected.length ||
  !statements.every((s, i) =>
    s.toLowerCase().startsWith(expected[i].toLowerCase())
  )
) {
  throw new Error('Проверка миграции не пройдена. База не изменена.');
}

for (let i = 0; i < statements.length; i++) {
  await db.query(statements[i], []);
  console.log(`SQL ${i + 1}/${statements.length}: OK`);
}

const result = await db`
  SELECT column_name
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'users'
    AND column_name IN ('nickname_effect', 'avatar_frame')
`;

if (result.length !== 2) {
  throw new Error('Проверка не пройдена: не все столбцы найдены.');
}

console.log('УСПЕХ: эффекты ника и рамки аватара добавлены.');
