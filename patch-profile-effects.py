from pathlib import Path

root = Path.cwd()
targets = [
    Path("app/page.tsx"),
    Path("app/api/[...path]/route.ts"),
    Path("app/player/[username]/page.tsx"),
    Path("app/style.css"),
]

for target in targets:
    if not (root / target).is_file():
        raise SystemExit(f"ОШИБКА: не найден файл {target}")

home = (root / targets[0]).read_text()
api = (root / targets[1]).read_text()
public = (root / targets[2]).read_text()
css = (root / targets[3]).read_text()

checks = {
    "тип пользователя": "nickname_color:string;" in home,
    "загрузка профиля": "setColor(j.user.nickname_color||'#a78bfa');setVkUrl" in home,
    "сохранение профиля": "nickname_color:color,vk_url:vkUrl" in home,
    "API сохранения": "nickname_color=${color},birth_date=${birth}" in api,
    "API публичного профиля": "SELECT id,username,display_name,bio,nickname_color,avatar_url,banner_url" in api,
    "аватар публичного профиля": '<div className="publicProfileAvatar">' in public,
    "заголовок публичного профиля": '<h1 style={{ color: player.nickname_color || "#c4b5fd" }}>' in public,
}

failed = [name for name, ok in checks.items() if not ok]
for name, ok in checks.items():
    print(("OK: " if ok else "НЕ СОВПАЛО: ") + name)

if failed:
    raise SystemExit(
        "\nПатч остановлен без изменения файлов. Пришли список несовпадений."
    )

if "/* HYPEGO PROFILE EFFECTS */" in css:
    print("CSS-эффекты уже добавлены. Повторное добавление не требуется.")
else:
    print("\nПроверка пройдена. Установщик подготовлен.")
    print("Исходники пока не изменены: следующим шагом применим проверенные изменения.")
