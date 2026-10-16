import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
const url=process.env.DATABASE_URL;if(!url){console.error('DATABASE_URL не настроен');process.exit(1)}
const rl=readline.createInterface({input,output});
const username=(await rl.question('Ник владельца (например Marfeiy): ')).trim();const email=(await rl.question('Email: ')).trim().toLowerCase();const password=await rl.question('Новый сложный пароль (не менее 12 символов): ');rl.close();
if(!/^[A-Za-z0-9_]{3,24}$/.test(username)||!email.includes('@')||password.length<12){console.error('Ник/email/пароль не прошли проверку');process.exit(1)}
const sql=neon(url),hash=await bcrypt.hash(password,12);
const rows=await sql`INSERT INTO users(username,email,password_hash,display_name) VALUES(${username},${email},${hash},${username}) ON CONFLICT(username) DO UPDATE SET email=EXCLUDED.email,password_hash=EXCLUDED.password_hash RETURNING id,username,email`;
await sql`INSERT INTO user_roles(user_id,role_id) VALUES(${rows[0].id},'owner') ON CONFLICT DO NOTHING`;
await sql`INSERT INTO user_roles(user_id,role_id) VALUES(${rows[0].id},'player') ON CONFLICT DO NOTHING`;
console.log(`Владелец создан/обновлён: ${rows[0].username} (${rows[0].email}). Сохраните пароль в менеджере паролей.`);
