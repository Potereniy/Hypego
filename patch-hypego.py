from pathlib import Path
p = Path("app/api/[...path]/route.ts")
s = p.read_text()
old = "['opka-deputy','👑 Заместитель','rank','main',75,'ОПКА: Заместитель. Осталось 1 место.']"
new = "['opka','⚡ ОПКА','privilege','main',0,'Игровая привилегия ОПКА']," + old
if old not in s:
    raise SystemExit("ОШИБКА: исходный товар не найден; файл не изменён")
if "['opka','⚡ ОПКА'" in s:
    raise SystemExit("ОПКА уже присутствует; ничего не изменено")
Path("app/api/[...path]/route.ts.bak-opka").write_text(s)
p.write_text(s.replace(old, new, 1))
print("OK: товар ОПКА добавлен в список seedProducts.")
print("Резервная копия: app/api/[...path]/route.ts.bak-opka")
