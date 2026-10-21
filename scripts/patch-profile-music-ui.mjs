import { readFile, writeFile } from 'node:fs/promises';

const pagePath = 'app/player/[username]/page.tsx';
const cssPath = 'app/style.css';
let page = await readFile(pagePath, 'utf8');
let css = await readFile(cssPath, 'utf8');

if (!page.includes('import MusicPlayer from "./MusicPlayer";')) {
  const importMarker = 'import { useParams } from "next/navigation";';
  if (!page.includes(importMarker)) {
    throw new Error('Не найден импорт useParams. Страница не изменена.');
  }
  page = page.replace(importMarker, importMarker + '\nimport MusicPlayer from "./MusicPlayer";');
}

if (!page.includes('<MusicPlayer username={username} />')) {
  const marker = '      <div className="publicProfileGrid">';
  if (!page.includes(marker)) {
    throw new Error('Не найден блок publicProfileGrid. Страница не изменена.');
  }
  page = page.replace(marker, '      <MusicPlayer username={username} />\n\n' + marker);
}

const cssMarker = '/* HYPEGO PROFILE MUSIC PLAYER */';
if (!css.includes(cssMarker)) {
  css += `
${cssMarker}
.profileMusic{position:relative;overflow:hidden;margin-top:18px;padding:25px;border:1px solid #a78bfa35;border-radius:20px;background:radial-gradient(ellipse at 5% 0%,#8b5cf622,transparent 42%),linear-gradient(145deg,#171a2b,#0d111c);box-shadow:0 16px 45px #0003;color:#f4f2ff}
.profileMusicLoading{color:var(--muted);font-size:13px}
.profileMusicHeading{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:22px}
.profileMusicHeading h2,.profileMusicEmpty h2{margin:5px 0 0;font-size:23px;letter-spacing:-.6px}
.profileMusicEyebrow{font:10px 'DM Mono',monospace;letter-spacing:1.7px;color:#a78bfa}
.profileMusicCount{font:11px 'DM Mono',monospace;color:#bdb6e5}
.profileMusicBody{display:grid;grid-template-columns:190px minmax(0,1fr);gap:30px;align-items:center}
.profileVinyl{width:180px;aspect-ratio:1;border-radius:50%;display:grid;place-items:center;background:repeating-radial-gradient(circle,#252634 0 2px,#101117 3px 5px,#292a38 6px 7px);box-shadow:0 0 0 7px #0a0c13,0 0 0 8px #a78bfa70,0 12px 35px #0008;position:relative}
.profileVinyl:before{content:"";position:absolute;inset:8px;border:1px solid #ffffff13;border-radius:50%}
.profileVinyl.isSpinning{animation:profileVinylSpin 4s linear infinite}
@keyframes profileVinylSpin{to{transform:rotate(360deg)}}
.profileVinylGrooves{width:54%;aspect-ratio:1;border-radius:50%;display:grid;place-items:center;overflow:hidden;border:4px solid #101117;background:linear-gradient(135deg,#a78bfa,#4c1d95);box-shadow:0 0 0 2px #d8b4fe55}
.profileVinylCover{width:100%;height:100%;object-fit:cover}
.profileVinylLabel{font-weight:900;font-size:27px;color:#fff}
.profileMusicDetails{min-width:0}
.profileMusicDetails h3{margin:8px 0 5px;font-size:clamp(20px,3vw,28px);overflow-wrap:anywhere}
.profileMusicDetails>p{margin:0;color:#aaaac2;font-size:13px}
.profileMusicControls{display:flex;align-items:center;gap:13px;margin:19px 0}
.profileMusicControls button{width:38px;height:38px;border:1px solid #ffffff18;border-radius:50%;background:#ffffff08;color:#e7e1ff;cursor:pointer}
.profileMusicControls .profileMusicPlay{width:48px;height:48px;background:#a78bfa;color:#151021;border:0;font-size:18px;box-shadow:0 0 22px #8b5cf644}
.profileMusicTimeline{display:grid;grid-template-columns:36px minmax(0,1fr) 36px;align-items:center;gap:8px}
.profileMusicTimeline span{font:10px 'DM Mono',monospace;color:#a9a8bd}
.profileMusic input[type=range]{width:100%;accent-color:#a78bfa;cursor:pointer}
.profileMusicVolume{display:flex;align-items:center;gap:12px;margin-top:12px;color:#a9a8bd;font-size:11px}
.profileMusicVolume input{max-width:150px}
.profileMusicPlaylist{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;margin-top:25px}
.profileMusicTrack{min-width:0;display:flex;align-items:center;gap:11px;padding:11px 12px;text-align:left;border:1px solid #ffffff0c;border-radius:12px;background:#ffffff04;color:#eeeaff;cursor:pointer}
.profileMusicTrack.active{border-color:#a78bfa75;background:#a78bfa13}
.profileMusicTrackNumber{width:24px;flex-shrink:0;color:#a78bfa;font:11px 'DM Mono',monospace}
.profileMusicTrackText{display:grid;gap:4px;min-width:0;flex:1}
.profileMusicTrackText strong,.profileMusicTrackText small{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.profileMusicTrackText strong{font-size:12px}
.profileMusicTrackText small{font-size:10px;color:#a9a8bd}
.profileMusicTrackAction{font-size:11px;color:#a78bfa}
.profileMusicError{margin:14px 0 0;color:#fca5a5;font-size:12px;line-height:1.6}
.profileMusicEmpty>p{margin-bottom:0;color:var(--muted);font-size:13px;line-height:1.7}
@media(max-width:560px){.profileMusic{padding:18px}.profileMusicBody{grid-template-columns:1fr;justify-items:center;gap:24px}.profileVinyl{width:155px}.profileMusicDetails{width:100%}.profileMusicPlaylist{grid-template-columns:1fr}.profileMusicHeading h2,.profileMusicEmpty h2{font-size:20px}}
`;
}

await writeFile(pagePath, page);
await writeFile(cssPath, css);
console.log('OK: виниловый плеер подключён к публичному профилю.');
