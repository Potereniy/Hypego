import { neon } from '@neondatabase/serverless';
import { readFile } from 'node:fs/promises';
const url=process.env.DATABASE_URL;
if(!url){console.error('DATABASE_URL отсутствует. Скопируйте .env.example в .env и заполните строку Neon.');process.exit(1)}
const sql=neon(url);
const schema=await readFile(new URL('../schema.sql',import.meta.url),'utf8');
// Neon HTTP API runs one statement per call; split schema while preserving dollar-free statements.
const statements=schema.split(';').map(s=>s.trim()).filter(Boolean);
for(let i=0;i<statements.length;i++){try{await sql.query(statements[i],[])}catch(e){console.error(`Ошибка SQL #${i+1}:`,e.message);throw e}}
console.log(`Схема применена: ${statements.length} SQL statements.`);
