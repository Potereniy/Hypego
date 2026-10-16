const fs = require('fs');

const file = 'app/page.tsx';
let s = fs.readFileSync(file, 'utf8');

const state = "const isStaff=roles.some(r=>['owner','deputy','management','curator','tech_admin','support','moderator','trainee'].includes(r.id));";
if (!s.includes(state)) {
  console.error('Не найден блок isStaff. Файл не изменён.');
  process.exit(1);
}
if (s.includes('const [drawerOpen,setDrawerOpen]')) {
  console.log('Состояние меню уже добавлено.');
} else {
  s = s.replace(state, state + "\nconst [drawerOpen,setDrawerOpen]=useState(false);");
}

const old = '<div className="right">{user?<><span className="miniName" style={{color:user.nickname_color}}>{user.username}</span><button className="outline" onClick={logout}>Выйти</button></>:<button className="primary" onClick={()=>setTab(\'auth\')}>Войти</button>}</div></header>';

const replacement = `<div className="right">{user?<><div className="headerBalance"><small>БАЛАНС</small><strong>{(Number(user.balance_cents||0)/100).toFixed(2)} €</strong></div><button type="button" className="accountTrigger" onClick={()=>setDrawerOpen(true)} aria-label="Открыть меню профиля"><span className="accountAvatar">{user.avatar_url?<img src={user.avatar_url} alt=""/>:(user.username||'H').slice(0,1).toUpperCase()}</span><span className="accountIdentity"><strong style={{color:user.nickname_color}}>{user.username}</strong><small>Мой аккаунт</small></span><span className="accountChevron">☰</span></button></>:<button className="primary" onClick={()=>setTab('auth')}>Войти</button>}</div></header>
{drawerOpen&&user&&<div className="drawerLayer"><button type="button" className="drawerScrim" aria-label="Закрыть меню" onClick={()=>setDrawerOpen(false)}></button><aside className="profileDrawer" aria-label="Меню аккаунта"><div className="drawerTop"><span className="eyebrow">HYPEGO / ACCOUNT</span><button type="button" className="drawerClose" onClick={()=>setDrawerOpen(false)}>×</button></div><div className="drawerUser"><div className="drawerAvatar">{user.avatar_url?<img src={user.avatar_url} alt=""/>:(user.username||'H').slice(0,1).toUpperCase()}</div><div><strong style={{color:user.nickname_color}}>{user.display_name||user.username}</strong><small>@{user.username}</small></div></div><div className="drawerBalance"><small>ТВОЙ БАЛАНС</small><strong>{(Number(user.balance_cents||0)/100).toFixed(2)} <span>EUR</span></strong><button type="button" className="outline" onClick={()=>{setTab('billing');setDrawerOpen(false)}}>＋ Пополнить баланс</button></div><div className="drawerLinks"><span className="drawerLabel">АККАУНТ</span><button type="button" onClick={()=>{setTab('profile');setDrawerOpen(false)}}>◈ <span>Профиль и настройки</span><b>›</b></button><button type="button" onClick={()=>{setTab('players');setDrawerOpen(false)}}>♙ <span>Игроки</span><b>›</b></button><button type="button" onClick={()=>{setTab('shop');setStore('main');setDrawerOpen(false)}}>◇ <span>Магазин</span><b>›</b></button><button type="button" onClick={()=>{setTab('rules');setDrawerOpen(false)}}>≡ <span>Правила и справка</span><b>›</b></button>{isStaff&&<><span className="drawerLabel">ПЕРСОНАЛ</span><button type="button" onClick={()=>{setTab('admin');setDrawerOpen(false)}}>⌘ <span>Панель управления</span><b>›</b></button></>}<span className="drawerLabel">СЕАНС</span><button type="button" className="drawerLogout" onClick={()=>{setDrawerOpen(false);logout()}}>↪ <span>Выйти из аккаунта</span></button></div><div className="drawerFooter">HYPEGO · ИГРОВОЙ ПОРТАЛ</div></aside></div>}`;

if (s.includes(old)) {
  s = s.replace(old, replacement);
} else if (!s.includes('className="profileDrawer"')) {
  console.error('Не найден блок шапки. Файл не изменён.');
  process.exit(1);
}

fs.writeFileSync(file, s);
console.log('Шапка и меню аккаунта обновлены.');
