import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { readFile } from 'node:fs/promises';

const url = process.env.DATABASE_URL;

if (!url) {
  console.error('DATABASE_URL не настроен. Миграции не запускались.');
  process.exit(1);
}

const sql = neon(url);

const migrationFiles = [
  '20261022_rcon.sql',
  '20261022_rcon_connection_status.sql',
];

for (const file of migrationFiles) {
  const migration = await readFile(
    new URL(`../migrations/${file}`, import.meta.url),
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
      console.error(
        `Ошибка миграции ${file}, SQL #${i + 1}:`,
        error instanceof Error ? error.message : error,
      );
      process.exit(1);
    }
  }

  console.log(`Подготовлена миграция ${file}: ${statements.length} SQL-команд.`);
}

console.log('Все миграции RCON успешно применены.');
