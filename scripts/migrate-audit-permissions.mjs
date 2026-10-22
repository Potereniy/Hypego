import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { readFile } from 'node:fs/promises';

if (!process.env.DATABASE_URL) {
  console.error('ОШИБКА: DATABASE_URL не найден. Проверь .env или .env.local.');
  process.exit(1);
}

const db = neon(process.env.DATABASE_URL);
const sql = await readFile(
  new URL('../migrations/20261023_audit_permissions.sql', import.meta.url),
  'utf8'
);

for (const statement of sql.split(';').map(s => s.trim()).filter(Boolean)) {
  await db.query(statement, []);
}

const rows = await db`
  SELECT r.id AS role_id, (rp.permission_id IS NOT NULL) AS audit_access
  FROM roles r
  LEFT JOIN role_permissions rp
    ON rp.role_id = r.id AND rp.permission_id = 'audit.view'
  WHERE r.id IN (
    'owner', 'deputy', 'management', 'curator',
    'tech_admin', 'support', 'moderator',
    'trainee', 'player', 'chsp'
  )
  ORDER BY r.id
`;

console.log('Проверка прав audit.view в Neon:');
console.table(rows);
