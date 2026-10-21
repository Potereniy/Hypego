from pathlib import Path
from datetime import datetime
import shutil
import sys

root = Path.cwd()
paths = {
    "home": root / "app/page.tsx",
    "api": root / "app/api/[...path]/route.ts",
    "public": root / "app/player/[username]/page.tsx",
    "css": root / "app/style.css",
}
original = {k: p.read_text() for k, p in paths.items()}
updated = dict(original)
errors = []

def rep(key, old, new, count=1):
    found = updated[key].count(old)
    if found != count:
        errors.append(
            f"{key}: ожидалось {count}, найдено {found}: {old[:100]!r}"
        )
    else:
        updated[key] = updated[key].replace(old, new, count)

# Тип, состояние и загрузка
rep("home", "  nickname_color:string;\n",
    "  nickname_color:string;\n  nickname_effect:string;\n  avatar_frame:string;\n")
rep("home", "[color,setColor]=useState('#a78bfa'),[vkUrl,setVkUrl]",
    "[color,setColor]=useState('#a78bfa'),[nicknameEffect,setNicknameEffect]=useState('none'),[avatarFrame,setAvatarFrame]=useState('none'),[vkUrl,setVkUrl]")
rep("home", "setColor(j.user.nickname_color||'#a78bfa');setVkUrl",
    "setColor(j.user.nickname_color||'#a78bfa');setNicknameEffect(j.user.nickname_effect||'none');setAvatarFrame(j.user.avatar_frame||'none');setVkUrl")

# Сохранение
rep("home", "nickname_color:color,vk_url:vkUrl",
    "nickname_color:color,nickname_effect:nicknameEffect,avatar_frame:avatarFrame,vk_url:vkUrl")

# Свой профиль
rep("home", '<div className="avatar">',
    '<div className={`avatar avatar-frame-${user.avatar_frame||"none"}`}>')
rep("home", '<h2 style={{color:user.nickname_color}}>',
    '<h2 className={`nickname-effect-${user.nickname_effect||"none"}`} style={{color:user.nickname_color}}>')

# Выбор эффектов и рамок в настройках
rep("home",
    '<label>Цвет ника<div className="colorInput"><input type="color" value={color} onChange={e=>setColor(e.target.value)}/><code>{color.toUpperCase()}</code></div></label>',
    '<label>Цвет ника<div className="colorInput"><input type="color" value={color} onChange={e=>setColor(e.target.value)}/><code>{color.toUpperCase()}</code></div></label>\n'
    '<label>Эффект ника<select value={nicknameEffect} onChange={e=>setNicknameEffect(e.target.value)}>'
    '<option value="none">Обычный</option><option value="gradient">Градиент</option>'
    '<option value="neon">Неон</option><option value="rgb">RGB</option></select></label>\n'
    '<label>Рамка аватара<select value={avatarFrame} onChange={e=>setAvatarFrame(e.target.value)}>'
    '<option value="none">Без рамки</option><option value="purple">Фиолетовая</option>'
    '<option value="neon">Неоновая</option><option value="fire">Огненная</option>'
    '<option value="electric">Электрическая</option></select></label>')
rep("home", "setColor(user.nickname_color||'#a78bfa');",
    "setColor(user.nickname_color||'#a78bfa');setNicknameEffect(user.nickname_effect||'none');setAvatarFrame(user.avatar_frame||'none');")
rep("home", '<div className="profilePreview"><span className="accountAvatar">',
    '<div className="profilePreview"><span className={`accountAvatar avatar-frame-${avatarFrame}`}')
rep("home", '<strong style={{color}}>{display||user.username}</strong>',
    '<strong className={`nickname-effect-${nicknameEffect}`} style={{color}}>{display||user.username}</strong>')

# API: допустимые значения
rep("api",
    "if(!/^#[0-9a-fA-F]{6}$/.test(color))throw new HttpError(400,'Некорректный цвет ника');",
    "if(!/^#[0-9a-fA-F]{6}$/.test(color))throw new HttpError(400,'Некорректный цвет ника');"
    "const effect=String(b.nickname_effect??u.nickname_effect??'none');"
    "const frame=String(b.avatar_frame??u.avatar_frame??'none');"
    "if(!['none','gradient','neon','rgb'].includes(effect))throw new HttpError(400,'Некорректный эффект ника');"
    "if(!['none','purple','neon','fire','electric'].includes(frame))throw new HttpError(400,'Некорректная рамка аватара');")
rep("api", "nickname_color=${color},birth_date=${birth}",
    "nickname_color=${color},nickname_effect=${effect},avatar_frame=${frame},birth_date=${birth}")
rep("api", "RETURNING id,username,display_name,bio,nickname_color,birth_date,avatar_url",
    "RETURNING id,username,display_name,bio,nickname_color,nickname_effect,avatar_frame,birth_date,avatar_url")
rep("api",
    "SELECT id,username,display_name,bio,nickname_color,avatar_url,banner_url,vk_url,telegram_username,created_at FROM users",
    "SELECT id,username,display_name,bio,nickname_color,nickname_effect,avatar_frame,avatar_url,banner_url,vk_url,telegram_username,created_at FROM users")

# Публичная страница
rep("public", '<div className="publicProfileAvatar">',
    '<div className={`publicProfileAvatar avatar-frame-${player.avatar_frame||"none"}`}>')
rep("public", '<h1 style={{ color: player.nickname_color || "#c4b5fd" }}>',
    '<h1 className={`nickname-effect-${player.nickname_effect||"none"}`} style={{ color: player.nickname_color || "#c4b5fd" }}>')
rep("public", '<strong style={{ color: player.nickname_color || "#c4b5fd" }}>',
    '<strong className={`nickname-effect-${player.nickname_effect||"none"}`} style={{ color: player.nickname_color || "#c4b5fd" }}>')

# Стили добавляются в конец, существующий CSS не перезаписываем
marker = "/* HYPEGO PROFILE EFFECTS */"
if marker in updated["css"]:
    errors.append("CSS-блок эффектов уже существует; проверь файл вручную.")
else:
    updated["css"] += """

/* HYPEGO PROFILE EFFECTS */
.nickname-effect-gradient {
  background: linear-gradient(90deg, #c4b5fd, #67e8f9, #f0abfc);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
.nickname-effect-neon {
  text-shadow: 0 0 5px currentColor, 0 0 14px currentColor;
}
.nickname-effect-rgb {
  animation: hypego-rgb-nickname 4s linear infinite;
}
@keyframes hypego-rgb-nickname {
  0%, 100% { color: #ff4d9d; text-shadow: 0 0 9px #ff4d9d88; }
  33% { color: #67e8f9; text-shadow: 0 0 9px #67e8f988; }
  66% { color: #c4b5fd; text-shadow: 0 0 9px #c4b5fd88; }
}
.avatar-frame-purple {
  border-color: #a78bfa !important;
  box-shadow: 0 0 0 2px #a78bfa66, 0 0 22px #8b5cf688 !important;
}
.avatar-frame-neon {
  border-color: #67e8f9 !important;
  box-shadow: 0 0 0 2px #67e8f966, 0 0 24px #22d3eeaa !important;
}
.avatar-frame-fire {
  border-color: #fb923c !important;
  box-shadow: 0 0 0 2px #f9731644, 0 0 24px #ef4444aa !important;
}
.avatar-frame-electric {
  border-color: #facc15 !important;
  box-shadow: 0 0 0 2px #a3e63577, 0 0 22px #38bdf8aa !important;
}
"""

if errors:
    print("ОШИБКА: файлы не изменены.")
    for e in errors:
        print("-", e)
    sys.exit(1)

stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
backups = []
try:
    for key, path in paths.items():
        if updated[key] != original[key]:
            backup = path.with_name(path.name + f".before-effects-{stamp}")
            shutil.copy2(path, backup)
            backups.append((path, backup))
    for key, path in paths.items():
        if updated[key] != original[key]:
            path.write_text(updated[key])
            print("Изменён:", path.relative_to(root))
    print("\nУСПЕХ: патч применён.")
    print("Резервные копии:")
    for path, backup in backups:
        print("-", backup.relative_to(root))
except Exception as e:
    print("Ошибка записи:", e)
    for path, backup in backups:
        shutil.copy2(backup, path)
    print("Выполнен возврат исходных файлов из резервных копий.")
    sys.exit(1)
