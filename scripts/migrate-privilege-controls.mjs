import { neon } from '@neondatabase/serverless';
import { readFileSync, existsSync } from 'node:fs';

for (const file of ['.env', '.env.local']) {
  if (!existsSync(file)) continue;
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*(DATABASE_URL)\s*=\s*(.*?)\s*$/);
    if (match && !process.env.DATABASE_URL) {
      process.env.DATABASE_URL =
        match[2].replace(/^['"]|['"]$/g, '');
    }
  }
}

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL не найден.');
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

await sql`
  ALTER TABLE privileges
  ADD COLUMN IF NOT EXISTS restricted_until TIMESTAMPTZ
`;

await sql`
  ALTER TABLE privileges
  ADD COLUMN IF NOT EXISTS restriction_reason TEXT
`;

await sql`
  ALTER TABLE privileges
  ADD COLUMN IF NOT EXISTS restricted_by UUID REFERENCES users(id)
`;

await sql`
  ALTER TABLE privileges
  ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ
`;

await sql`
  ALTER TABLE privileges
  ADD COLUMN IF NOT EXISTS revoked_by UUID REFERENCES users(id)
`;

await sql`
  ALTER TABLE privileges
  ADD COLUMN IF NOT EXISTS revocation_reason TEXT
`;

console.log('OK: поля управления привилегиями добавлены.');
