from pathlib import Path
import re

route_path = Path("app/api/[...path]/route.ts")
home_path = Path("app/page.tsx")
public_path = Path("app/player/[username]/page.tsx")

route = route_path.read_text()
home = home_path.read_text()
public = public_path.read_text()

# Check exact insertion points before changing any source.
for name, source, needle in [
    ("API me", route, "if(key==='me'&&method==='GET')"),
    ("API player", route, "if(key==='player'&&method==='GET')"),
    ("Personal profile card", home, '<article className="panel profileRoles">'),
    ("Public profile contacts", public, '<span className="eyebrow">CONTACTS</span>'),
    ("Personal profile state", home, '[roles,setRoles]=useState<any[]>([])'),
]:
    if needle not in source:
        raise SystemExit("STOP: не найден фрагмент: " + name)

me_new = """if(key==='me'&&method==='GET'){const u=await requireUser();const roles=await db`SELECT r.id,r.title,r.rank FROM user_roles ur JOIN roles r ON r.id=ur.role_id WHERE ur.user_id=${u.id} ORDER BY r.rank DESC`;const privileges=await db`SELECT id,server_name,minecraft_username,product_name,status,created_at FROM privileges WHERE user_id=${u.id} ORDER BY created_at DESC`;return Response.json({user:u,roles,privileges});}"""
route, n = re.subn(
    r"if\(key==='me'&&method==='GET'\)\{.*?\}",
    lambda _: me_new, route, count=1, flags=re.S
)
if n != 1:
    raise SystemExit("STOP: API me не удалось заменить.")

player_replacement = r"""\1
                const owner=rows[0];
                const roles=await db`SELECT r.id,r.title,r.rank FROM user_roles ur JOIN roles r ON r.id=ur.role_id WHERE ur.user_id=${owner.id} ORDER BY r.rank DESC`;
                const privileges=await db`SELECT id,server_name,minecraft_username,product_name,status,created_at FROM privileges WHERE user_id=${owner.id} ORDER BY created_at DESC`;
                return Response.json({player:{...owner,roles,privileges}});"""
route, n = re.subn(
    r"(if\(key==='player'&&method==='GET'\)\{.*?if\(!rows\.length\)throw new HttpError\(404,'Игрок не найден'\);)\s*return Response\.json\(\{player:rows\[0\]\}\);",
    player_replacement, route, count=1, flags=re.S
)
if n != 1:
    raise SystemExit("STOP: API player не удалось заменить.")

home = home.replace(
    '[roles,setRoles]=useState<any[]>([]),[products',
    '[roles,setRoles]=useState<any[]>([]),[privileges,setPrivileges]=useState<any[]>([]),[products',
    1
)
home = home.replace(
    'setUser(j.user);setRoles(j.roles||[]);setDisplay',
    'setUser(j.user);setRoles(j.roles||[]);setPrivileges(j.privileges||[]);setDisplay',
    1
)
home = home.replace(
    'setUser(null);setRoles([]);return null;',
    'setUser(null);setRoles([]);setPrivileges([]);return null;',
    1
)

role_card = '''<article className="panel profileRoles">
    <div className="profileCardHeading">
      <div>
        <div className="eyebrow">STAFF ROLES</div>
        <h3>Роли персонала</h3>
      </div>
      <span className="profileCardIcon">♜</span>
    </div>
    {roles.length
      ? <div className="profileRoleList">
          {roles.map(r=><span key={r.id}>{r.title}</span>)}
        </div>
      : <p className="profileBio">Ролей персонала нет</p>
    }
  </article>

  <article className="panel profileRoles">
    <div className="profileCardHeading">
      <div>
        <div className="eyebrow">MINECRAFT PRIVILEGES</div>
        <h3>Мои Minecraft-привилегии</h3>
      </div>
      <span className="profileCardIcon">✧</span>
    </div>
    {privileges.length
      ? <div className="profileRoleList">
          {privileges.map((p:any)=><div key={p.id} style={{padding:'10px 0',borderBottom:'1px solid var(--line, #3333)'}}>
            <strong>{p.product_name}</strong>
            <p className="profileBio">Ник: {p.minecraft_username} · Сервер: {p.server_name}</p>
            <p className="profileBio">Статус: {{active:'Активна',blocked:'Заблокирована',revoked:'Отозвана',pending:'Ожидает выдачи'}[p.status]||p.status}</p>
          </div>)}
        </div>
      : <p className="profileBio">Minecraft-привилегий пока нет</p>
    }
  </article>'''

home, n = re.subn(
    r'<article className="panel profileRoles">.*?</article>',
    lambda _: role_card, home, count=1, flags=re.S
)
if n != 1:
    raise SystemExit("STOP: карточка личного профиля не заменена.")

public_cards = '''        <section className="publicProfileCard">
          <div className="publicProfileSectionTitle">
            <div><span className="eyebrow">STAFF ROLES</span><h2>Роли персонала</h2></div>
            <span className="publicProfileIcon">♜</span>
          </div>
          {player.roles?.length
            ? <div className="publicProfileLinks">{player.roles.map((r:any)=><div key={r.id}><span>{r.title}</span></div>)}</div>
            : <p className="publicProfileMuted">Ролей персонала нет.</p>}
        </section>
        <section className="publicProfileCard">
          <div className="publicProfileSectionTitle">
            <div><span className="eyebrow">MINECRAFT PRIVILEGES</span><h2>Minecraft-привилегии</h2></div>
            <span className="publicProfileIcon">✧</span>
          </div>
          {player.privileges?.length
            ? <div className="publicProfileLinks">{player.privileges.map((p:any)=><div key={p.id}>
                <span><strong>{p.product_name}</strong><br />Ник: {p.minecraft_username}<br />Сервер: {p.server_name}<br />Статус: {{active:'Активна',blocked:'Заблокирована',revoked:'Отозвана',pending:'Ожидает выдачи'}[p.status]||p.status}</span>
              </div>)}</div>
            : <p className="publicProfileMuted">Minecraft-привилегий пока нет.</p>}
        </section>

'''
public, n = re.subn(
    r'(?=        <section className="publicProfileCard">\s*<div className="publicProfileSectionTitle">\s*<div>\s*<span className="eyebrow">CONTACTS</span>)',
    lambda _: public_cards, public, count=1
)
if n != 1:
    raise SystemExit("STOP: место вставки в публичном профиле не найдено.")

# Write only after every replacement succeeded.
route_path.write_text(route)
home_path.write_text(home)
public_path.write_text(public)
print("OK: API и оба профиля обновлены.")
