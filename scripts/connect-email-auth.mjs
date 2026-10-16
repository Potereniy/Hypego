import fs from 'node:fs';

const file = 'app/api/[...path]/route.ts';
let s = fs.readFileSync(file, 'utf8');

const imports = [
  ["import { NextRequest } from 'next/server';", "import { NextRequest } from 'next/server';\nimport { cookies } from 'next/headers';\nimport { randomInt } from 'node:crypto';"],
  ["import { sql } from '@/lib/db';", "import { sql } from '@/lib/db';\nimport { appUrl, sendEmail } from '@/lib/mail';\nimport { randomToken, hashToken, createEmailToken, createLoginCode, isTrustedDevice, trustDevice, clearTrustedDeviceCookie, hashCode } from '@/lib/email-auth';"]
];

for (const [from, to] of imports) {
  if (s.includes(to)) continue;
  if (!s.includes(from)) throw new Error('Не найден импорт: ' + from);
  s = s.replace(from, to);
}

const start = s.indexOf("if(key==='auth/register'&&method==='POST')");
const end = s.indexOf("if(key==='auth/logout'&&method==='POST')", start);
if (start < 0 || end < 0) throw new Error('Не найдены границы auth/register и auth/logout; API не изменён.');

const routes = fs.readFileSync('scripts/auth-routes.txt', 'utf8');
s = s.slice(0, start) + routes + ' ' + s.slice(end);
fs.writeFileSync(file, s);
console.log('OK: API-маршруты обновлены');
