import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  throw new Error('Не найдена DATABASE_URL в .env');
}

const sql = neon(process.env.DATABASE_URL);

const roles = await sql`
  SELECT rank FROM roles WHERE id = 'chsp'
`;

if (roles.length) {
  await sql`
    UPDATE roles
    SET title = 'ЧСП'
    WHERE id = 'chsp'
  `;
} else {
  const rankRows = await sql`
    SELECT COALESCE(MIN(rank), 0) - 10 AS rank FROM roles
  `;
  const rank = Number(rankRows[0].rank);

  await sql`
    INSERT INTO roles (id, title, rank, is_project_owner)
    VALUES ('chsp', 'ЧСП', ${rank}, FALSE)
  `;
}

console.log('Роль ЧСП добавлена в базу данных.');
