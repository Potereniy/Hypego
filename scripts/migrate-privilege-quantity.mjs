import { neon } from '@neondatabase/serverless';
import { readFileSync, existsSync } from 'node:fs';

for (const file of ['.env', '.env.local']) {
  if (!existsSync(file)) continue;
  const content = readFileSync(file, 'utf8');
  for (const line of content.split(/\r?\n/)) {
    const match = line.match(/^\s*(DATABASE_URL)\s*=\s*(.*?)\s*$/);
    if (!match || process.env.DATABASE_URL) continue;
    process.env.DATABASE_URL = match[2].replace(/^['"]|['"]$/g, '');
  }
}
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL не найден в окружении, .env или .env.local');
  process.exit(1);
}
const sql = neon(process.env.DATABASE_URL);
await sql`ALTER TABLE privileges ADD COLUMN IF NOT EXISTS quantity INTEGER NOT NULL DEFAULT 1`;
await sql`ALTER TABLE privileges DROP CONSTRAINT IF EXISTS privileges_quantity_check`;
await sql`ALTER TABLE privileges ADD CONSTRAINT privileges_quantity_check CHECK (quantity BETWEEN 1 AND 1000000)`;
console.log('OK: в privileges добавлено поле quantity.');
