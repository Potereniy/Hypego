import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { readFile } from 'node:fs/promises';

const url = process.env.DATABASE_URL;

if (!url) {
  console.error('DATABASE_URL не настроен. Миграция не запускалась.');
  process.exit(1);
}

const sql = neon(url);
const migration = await readFile(
  new URL('../migrations/20261022_rcon.sql', import.meta.url),
  'utf8',
);

const statements = migration
  .replace(/^\s*BEGIN\s*;/i, '')
  .replace(/COMMIT\s*;\s*$/i, '')
  .split(';')
  .map(statement => statement.trim())
  .filter(Boolean);

for (let i = 0; i < statements.length; i++) {
  try {
    await sql.query(statements[i], []);
  } catch (error) {
    console.error(`Ошибка SQL #${i + 1}:`, error.message);
    process.exit(1);
  }
}

console.log(`Миграция RCON применена: ${statements.length} SQL-команд.`);
