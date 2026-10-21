import { readFile, writeFile } from "node:fs/promises";

const pagePath = "app/page.tsx";
const cssPath = "app/style.css";
let page = await readFile(pagePath, "utf8");
let css = await readFile(cssPath, "utf8");

const importLine = "import {useEffect,useState} from 'react';";

if (!page.includes('from "./player/[username]/ProfileMusicSettings"')) {
  if (!page.includes(importLine)) {
    throw new Error("Не найден импорт React. Файл не изменён.");
  }
  page = page.replace(
    importLine,
    importLine + '\nimport ProfileMusicSettings from "./player/[username]/ProfileMusicSettings";'
  );
}

const marker = '<div className="profileSettingsTip"><span>ⓘ</span>';

if (!page.includes("<ProfileMusicSettings username={user.username} />")) {
  if (!page.includes(marker)) {
    throw new Error("Не найден блок profileSettingsTip. Файл не изменён.");
  }
  page = page.replace(
    marker,
    '<ProfileMusicSettings username={user.username} />\n' + marker
  );
}

const cssMarker = "/* HYPEGO PROFILE MUSIC SOURCES */";

if (!css.includes(cssMarker)) {
  css += `
${cssMarker}
.profileMusicManager{margin-top:14px;min-width:0}
.profileMusicManager .form{gap:12px}
.profileMusicManagerNotice{font-size:12px;line-height:1.6;color:var(--muted);overflow-wrap:anywhere}
.profileMusicManagerList{margin-top:22px}
.profileMusicManagerList h4{margin:0 0 12px}
.profileMusicManagerItem{display:flex;align-items:center;gap:10px;padding:11px 0;border-bottom:1px solid #ffffff12;min-width:0}
.profileMusicManagerItem>span{font:11px 'DM Mono',monospace;color:#a78bfa}
.profileMusicManagerItem>div{display:grid;gap:4px;flex:1;min-width:0}
.profileMusicManagerItem strong,.profileMusicManagerItem small{overflow-wrap:anywhere}
.profileMusicManagerItem strong{font-size:12px}
.profileMusicManagerItem small{font-size:10px;color:var(--muted)}
.profileMusicManagerItem button{flex-shrink:0;padding:7px 9px;font-size:11px}
.profileMusicEmbed{width:100%;margin-top:22px;overflow:hidden;border:1px solid #a78bfa35;border-radius:14px;background:#080a12;aspect-ratio:16/9}
.profileMusicEmbed iframe{display:block;width:100%;height:100%;border:0}
.profileMusicSpotify{aspect-ratio:unset;height:152px}
.profileMusicSpotify iframe{min-height:152px}
.profileMusicExternal{margin-top:22px;padding:18px;border:1px solid #a78bfa35;border-radius:14px;background:#ffffff05}
.profileMusicExternal p{font-size:12px;line-height:1.7;color:var(--muted)}
.profileMusicExternal a,.profileMusicError a{color:#c4b5fd;text-decoration:underline}
`;
}

await writeFile(pagePath, page);
await writeFile(cssPath, css);

console.log("OK: менеджер музыки подключён к настройкам профиля.");
