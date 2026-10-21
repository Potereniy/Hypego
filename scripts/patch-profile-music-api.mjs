import { readFile, writeFile } from 'node:fs/promises';

const path = 'app/api/[...path]/route.ts';
let source = await readFile(path, 'utf8');

if (source.includes("key==='profile/music-upload'")) {
  throw new Error('Музыкальные API уже добавлены. Повторный патч отменён.');
}

const marker = " if(key==='profile/upload'&&method==='POST'){";
if (!source.includes(marker)) {
  throw new Error('Не найден ожидаемый участок загрузки профиля. Файл не изменён.');
}

const block = `
 if(key==='profile/tracks'&&method==='GET'){
  const username=(req.nextUrl.searchParams.get('username')||'').trim().slice(0,24);
  if(!/^[A-Za-z0-9_]{3,24}$/.test(username))throw new HttpError(400,'Некорректный ник');
  const owners=await db\`SELECT id FROM users WHERE username ILIKE \${username} LIMIT 1\`;
  if(!owners.length)throw new HttpError(404,'Игрок не найден');
  const tracks=await db\`SELECT id,title,artist,audio_url,cover_url,sort_order,created_at FROM profile_tracks WHERE user_id=\${owners[0].id} ORDER BY sort_order,created_at LIMIT 20\`;
  return Response.json({tracks});
 }
 if(key==='profile/tracks'&&method==='POST'){
  const u=await requireUser(),b=await bodyJson(req);
  const title=String(b.title||'').trim().slice(0,120);
  const artist=String(b.artist||'').trim().slice(0,120);
  const audioUrl=String(b.audio_url||'').trim().slice(0,2000);
  const coverUrl=String(b.cover_url||'').trim().slice(0,2000);
  const isHttps=(value:string)=>{try{return new URL(value).protocol==='https:';}catch{return false;}};
  if(title.length<1)throw new HttpError(400,'Укажи название трека');
  if(!isHttps(audioUrl))throw new HttpError(400,'Ссылка на аудио должна начинаться с https://');
  if(coverUrl&&!isHttps(coverUrl))throw new HttpError(400,'Ссылка на обложку должна начинаться с https://');
  const count=await db\`SELECT COUNT(*)::int AS count FROM profile_tracks WHERE user_id=\${u.id}\`;
  if(Number(count[0]?.count||0)>=20)throw new HttpError(400,'В плейлисте может быть не больше 20 треков');
  const rows=await db\`INSERT INTO profile_tracks(user_id,title,artist,audio_url,cover_url,sort_order) VALUES(\${u.id},\${title},\${artist},\${audioUrl},\${coverUrl||null},(SELECT COALESCE(MAX(sort_order),-1)+1 FROM profile_tracks WHERE user_id=\${u.id})) RETURNING id,title,artist,audio_url,cover_url,sort_order,created_at\`;
  await audit(u.id,'profile.track.add','profile_track',rows[0].id);
  return Response.json({track:rows[0]}, {status:201});
 }
 if(key==='profile/tracks'&&method==='DELETE'){
  const u=await requireUser(),b=await bodyJson(req),id=String(b.id||'');
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id))throw new HttpError(400,'Некорректный ID трека');
  const rows=await db\`DELETE FROM profile_tracks WHERE id=\${id} AND user_id=\${u.id} RETURNING id\`;
  if(!rows.length)throw new HttpError(404,'Трек не найден в твоём плейлисте');
  await audit(u.id,'profile.track.delete','profile_track',id);
  return Response.json({ok:true});
 }
 if(key==='profile/music-upload'&&method==='POST'){
  const u=await requireUser();
  if(!process.env.BLOB_READ_WRITE_TOKEN)throw new HttpError(503,'Загрузка недоступна: настрой BLOB_READ_WRITE_TOKEN в Vercel');
  const form=await req.formData(),file=form.get('file');
  if(!(file instanceof File))throw new HttpError(400,'Выбери аудиофайл');
  const allowed=['audio/mpeg','audio/mp3','audio/mp4','audio/x-m4a','audio/aac','audio/wav','audio/x-wav','audio/ogg','audio/webm','audio/flac'];
  if(!allowed.includes(file.type.toLowerCase()))throw new HttpError(400,'Поддерживаются MP3, M4A, AAC, WAV, OGG, WEBM и FLAC');
  if(file.size<1||file.size>20*1024*1024)throw new HttpError(400,'Размер аудиофайла должен быть не больше 20 МБ');
  const safeName=file.name.replace(/[^a-zA-Z0-9._-]/g,'_').slice(-100);
  const blob=await put(\`profiles/\${u.id}/music-\${Date.now()}-\${safeName}\`,file,{access:'public',token:process.env.BLOB_READ_WRITE_TOKEN,contentType:file.type});
  await audit(u.id,'profile.music.upload','profile_track',u.id);
  return Response.json({url:blob.url});
 }
`;

source = source.replace(marker, block + marker);
await writeFile(path, source);
console.log('OK: API музыкального плейлиста добавлен.');
