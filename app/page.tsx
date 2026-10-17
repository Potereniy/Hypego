'use client';
import {useEffect,useState} from 'react';
import TraineeApplications from './trainee-applications';
type User={
  id:string;
  username:string;
  email:string;
  display_name:string;
  avatar_url:string|null;
  banner_url:string|null;
 vk_url:string|null;
 telegram_username:string|null;
  nickname_color:string;
  bio:string;
  donation_balance_rub_kopecks:string|number;
  hp_balance:string|number;
};
type Product={id:string;name:string;description:string;category:string;store:string;price_cents:number;currency:string;discount_percent:number;requires_staff:boolean};
async function api(url:string,init?:RequestInit){const r=await fetch('/api/'+url,{...init,headers:{'Content-Type':'application/json',...(init?.headers||{})}});const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.error||'Ошибка запроса');return j;}
export default function Home(){const [user,setUser]=useState<User|null>(null),[roles,setRoles]=useState<any[]>([]),[products,setProducts]=useState<Product[]>([]),[tab,setTab]=useState('home'),[store,setStore]=useState('main'),[login,setLogin]=useState(''),[password,setPassword]=useState(''),[email,setEmail]=useState(''),[mode,setMode]=useState('login'),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false),[display,setDisplay]=useState(''),[bio,setBio]=useState(''),[color,setColor]=useState('#a78bfa'),[vkUrl,setVkUrl]=useState(''),[telegramUsername,setTelegramUsername]=useState(''),[target,setTarget]=useState(''),[currency,setCurrency]=useState('KZT'),[amount,setAmount]=useState('1000'),[challengeId,setChallengeId]=useState(''),[loginCode,setLoginCode]=useState('');
async function load(){try{const j=await api('me');setUser(j.user);setRoles(j.roles||[]);setDisplay(j.user.display_name||j.user.username);setBio(j.user.bio||'');setColor(j.user.nickname_color||'#a78bfa');setVkUrl(j.user.vk_url||'');setTelegramUsername(j.user.telegram_username||'');return j.user as User;}catch{setUser(null);setRoles([]);return null;}}
async function loadProducts(s=store){try{const j=await api('products?store='+s);setProducts(j.products||[])}catch(e:any){setNotice(e.message)}}
useEffect(()=>{load()},[]);useEffect(()=>{if(user)loadProducts(store)},[user,store]);
async function auth(e:React.FormEvent) {
  e.preventDefault();
  setBusy(true);
  setNotice('');
  try {
    const result = await api('auth/' + mode, {
      method: 'POST',
      body: JSON.stringify(mode === 'login' ? { login, password } : { username: login, email, password })
    });

    if (mode === 'register') {
      setNotice(result.message || 'Аккаунт создан. Проверьте почту и подтвердите email.');
      return;
    }

    const loadedUser = await load();
    if (!loadedUser) throw new Error('Сессия не создана. Попробуйте войти ещё раз.');

    setChallengeId('');
    setLoginCode('');
    setTab('home');
    setNotice('Вы вошли в Hypego.');
  } catch (e: any) {
    setNotice(e.message);
  } finally {
    setBusy(false);
  }
}

async function verifyLoginCode(e:React.FormEvent) {
  e.preventDefault();
  setBusy(true);
  setNotice('');
  try {
    await api('auth/verify-login', {
      method: 'POST',
      body: JSON.stringify({ challengeId, code: loginCode.trim() })
    });

    const loadedUser = await load();
    if (!loadedUser) throw new Error('Код принят, но сессия не найдена. Попробуйте войти снова.');

    setChallengeId('');
    setLoginCode('');
    setTab('home');
    setNotice('Вы вошли в Hypego.');
  } catch (e: any) {
    setNotice(e.message);
  } finally {
    setBusy(false);
  }
}

async function resendVerification() {
  setBusy(true);
  setNotice('');
  try {
    const j = await api('auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ login, password })
    });
    setNotice(j.message || 'Проверь почту.');
  } catch (e: any) {
    setNotice(e.message);
  } finally {
    setBusy(false);
  }
}

async function saveProfile(e:React.FormEvent){e.preventDefault();try{await api('profile',{method:'PATCH',body:JSON.stringify({display_name:display,bio,nickname_color:color,vk_url:vkUrl,telegram_username:telegramUsername})});await load();setNotice('Профиль сохранён.')}catch(e:any){setNotice(e.message)}}
async function upload(kind:string,file?:File){if(!file)return;const fd=new FormData();fd.set('kind',kind);fd.set('file',file);try{const r=await fetch('/api/profile/upload',{method:'POST',body:fd});const j=await r.json();if(!r.ok)throw new Error(j.error);await load();setNotice('Изображение обновлено.')}catch(e:any){setNotice(e.message)}}
async function buy(p:Product){const mc=prompt('Minecraft-ник, которому выдать товар:',user?.username||'');if(!mc)return;try{const j=await api('orders',{method:'POST',body:JSON.stringify({product_id:p.id,minecraft_username:mc})});setNotice(j.payment?.message||'Заказ создан.');}catch(e:any){setNotice(e.message)}}
async function logout(){await api('auth/logout',{method:'POST'});setUser(null);setRoles([]);setNotice('Вы вышли из аккаунта.');}
const isStaff=roles.some(r=>['owner','deputy','management','curator','tech_admin'].includes(r.id));
const canAccessStaffShop=roles.some(r=>['trainee','moderator','support','tech_admin','curator','management','deputy','owner'].includes(r.id));
const [drawerOpen,setDrawerOpen]=useState(false);
return <main><header className="top"><a className="brand" href="#" onClick={()=>setTab('home')}><span className="brandMark">H</span> HYPEGO</a><nav><button onClick={()=>setTab('home')}>Главная</button><button onClick={()=>{setTab('shop');setStore('main')}}>Магазин</button><button onClick={()=>setTab('rules')}>Правила</button><button onClick={()=>setTab('players')}>Игроки</button><button onClick={()=>setTab('trainee')}>Стажировка</button>{user&&<button onClick={()=>setTab('profile')}>Профиль</button>}{isStaff&&<button onClick={()=>setTab('admin')}>Управление</button>}</nav><div className="right">{user?<><div className="headerBalance"><small>БАЛАНС</small><strong>{(Number(user.donation_balance_rub_kopecks||0)/100).toFixed(2)} ₽</strong></div><button type="button" className="accountTrigger" onClick={()=>setDrawerOpen(true)} aria-label="Открыть меню профиля"><span className="accountAvatar">{user.avatar_url?<img src={user.avatar_url} alt=""/>:(user.username||'H').slice(0,1).toUpperCase()}</span><span className="accountIdentity"><strong style={{color:user.nickname_color}}>{user.username}</strong><small>Мой аккаунт</small></span><span className="accountChevron">☰</span></button></>:<button className="primary" onClick={()=>setTab('auth')}>Войти</button>}</div></header>
{drawerOpen&&user&&<div className="drawerLayer"><button type="button" className="drawerScrim" aria-label="Закрыть меню" onClick={()=>setDrawerOpen(false)}></button><aside className="profileDrawer" aria-label="Меню аккаунта"><div className="drawerTop"><span className="eyebrow">HYPEGO / ACCOUNT</span><button type="button" className="drawerClose" onClick={()=>setDrawerOpen(false)}>×</button></div><div className="drawerUser"><div className="drawerAvatar">{user.avatar_url?<img src={user.avatar_url} alt=""/>:(user.username||'H').slice(0,1).toUpperCase()}</div><div><strong style={{color:user.nickname_color}}>{user.display_name||user.username}</strong><small>@{user.username}</small></div></div><div className="drawerBalance"><small>ТВОЙ БАЛАНС</small><strong>{(Number(user.donation_balance_rub_kopecks||0)/100).toFixed(2)} <span>₽</span></strong><button type="button" className="outline" onClick={()=>{setTab('billing');setDrawerOpen(false)}}>＋ Пополнить баланс</button></div><div className="drawerLinks"><span className="drawerLabel">АККАУНТ</span><button type="button" onClick={()=>{setTab('profile');setDrawerOpen(false)}}>◈ <span>Профиль и настройки</span><b>›</b></button><button type="button" onClick={()=>{setTab('players');setDrawerOpen(false)}}>♙ <span>Игроки</span><b>›</b></button><button type="button" onClick={()=>{setTab('trainee');setDrawerOpen(false)}}>✧ <span>Стажировка</span><b>›</b></button><button type="button" onClick={()=>{setTab('shop');setStore('main');setDrawerOpen(false)}}>◇ <span>Магазин</span><b>›</b></button><button type="button" onClick={()=>{setTab('rules');setDrawerOpen(false)}}>≡ <span>Правила и справка</span><b>›</b></button>{isStaff&&<><span className="drawerLabel">ПЕРСОНАЛ</span><button type="button" onClick={()=>{setTab('admin');setDrawerOpen(false)}}>⌘ <span>Панель управления</span><b>›</b></button></>}<span className="drawerLabel">СЕАНС</span><button type="button" className="drawerLogout" onClick={()=>{setDrawerOpen(false);logout()}}>↪ <span>Выйти из аккаунта</span></button></div><div className="drawerFooter">HYPEGO · ИГРОВОЙ ПОРТАЛ</div></aside></div>}
{notice&&<div className="notice" role="status">{notice}<button onClick={()=>setNotice('')}>×</button></div>}
{tab==='home'&&<><section className="hero"><div className="heroContent"><div className="eyebrow"><span className="pulse"/> MINECRAFT NETWORK · HYPEGO</div><h1>ТВОЯ ИГРА.<br/><em>ТВОИ ПРАВИЛА.</em></h1><p>Залетай в мир Hypego — играй с друзьями, собирай привилегии и создавай собственную историю.</p><div className="heroActions"><button className="primary big" onClick={()=>setTab(user?'shop':'auth')}>{user?'Открыть магазин':'Начать играть'} <b>↗</b></button><button className="outline big" onClick={()=>setTab('rules')}>Правила проекта</button></div><div className="serverAddress"><span className="serverDot"/><div><small>АДРЕС СЕРВЕРА</small><strong>hypego.org:19132</strong></div><button onClick={()=>{navigator.clipboard?.writeText('hypego.org:19132');setNotice('Адрес скопирован.')}}>Копировать</button></div></div><div className="heroArt"><div className="ring ring1"/><div className="ring ring2"/><div className="cube">H</div><div className="floatTag tagOne">✦ <span>YOUR WORLD</span></div><div className="floatTag tagTwo">⚡ <span>HYPEGO NETWORK</span></div></div></section><ServerStatus/><section className="stats"><div><strong>01</strong><span>ЕДИНЫЙ ПРОФИЛЬ</span></div><div><strong>∞</strong><span>ВОЗМОЖНОСТЕЙ</span></div><div><strong>24/7</strong><span>ТВОЯ ИСТОРИЯ</span></div><div><strong>H+</strong><span>HYPEGO COMMUNITY</span></div></section><section className="section"><div className="sectionHead"><div><div className="eyebrow">ТВОЯ ПЛАТФОРМА</div><h2>Всё для игры — <em>в одном месте</em></h2></div><p>Управляй профилем, изучай товары и следи за новостями проекта.</p></div><div className="featureGrid"><article className="feature"><span>◈</span><h3>Профиль игрока</h3><p>Аватар, баннер, цвет ника, история и персональная страница.</p><button onClick={()=>setTab(user?'profile':'auth')}>Открыть профиль ↗</button></article><article className="feature"><span>✧</span><h3>Магазин Hypego</h3><p>Привилегии, расходники, услуги и игровые улучшения.</p><button onClick={()=>setTab(user?'shop':'auth')}>Перейти в магазин ↗</button></article><article className="feature"><span>⌘</span><h3>Сообщество</h3><p>Находи игроков, знакомься и оставайся частью проекта.</p><button onClick={()=>setTab('players')}>Найти игроков ↗</button></article></div></section></>}
{tab==='auth'&&<section className="panel authPanel"><div className="eyebrow">HYPEGO ACCOUNT</div><h2>{mode==='login'?'С возвращением':'Создать аккаунт'}</h2><p className="muted">Один аккаунт для профиля и сервисов проекта.</p>{!challengeId&&<form onSubmit={auth} className="form"> <label>{mode==='login'?'Никнейм или email':'Никнейм'}<input value={login} onChange={e=>setLogin(e.target.value)} required autoComplete="username"/></label>{mode==='register'&&<label>Email<input type="email" value={email} onChange={e=>setEmail(e.target.value)} required autoComplete="email"/></label>}<label>Пароль<input type="password" value={password} onChange={e=>setPassword(e.target.value)} required minLength={10} autoComplete={mode==='login'?'current-password':'new-password'}/></label><button className="primary big" disabled={busy}>{busy?'Подождите…':mode==='login'?'Войти':'Зарегистрироваться'}</button></form>}
{challengeId&&<form onSubmit={verifyLoginCode} className="form"><label>Код входа из письма<input inputMode="numeric" autoComplete="one-time-code" value={loginCode} onChange={e=>setLoginCode(e.target.value.replace(/\D/g,'').slice(0,6))} required minLength={6} maxLength={6} placeholder="123456"/></label><button className="primary big" disabled={busy||loginCode.length!==6}>{busy?'Проверяем…':'Подтвердить вход'}</button><button type="button" className="textButton" disabled={busy} onClick={()=>{setChallengeId('');setLoginCode('');setNotice('Войдите заново, чтобы получить новый код.')}}>Вернуться ко входу</button></form>}
{mode === 'login' && !challengeId && notice.includes('Сначала подтвердите email') && (
  <button type="button" className="textButton" disabled={busy} onClick={resendVerification}>
    {busy ? 'Отправляем…' : 'Отправить письмо подтверждения повторно'}
  </button>
)}
<button className="textButton" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
  {mode === 'login' ? 'Нет аккаунта? Создать' : 'Уже есть аккаунт? Войти'}
</button></section>}
{tab==='profile'&&user&&<section className="section profilePage">
<div className="profileBanner profileBannerModern" style={{backgroundImage:user.banner_url?`linear-gradient(90deg,#090b12ee,#11152166),url(${user.banner_url})`:undefined}}>
<div className="avatar">{user.avatar_url?<img src={user.avatar_url} alt="Аватар"/>:user.username.slice(0,1).toUpperCase()}</div>
<div className="profileBannerIdentity"><div className="eyebrow"><span className="pulse"/> PLAYER PROFILE</div><h2 style={{color:user.nickname_color}}>{user.display_name||user.username}</h2><p>@{user.username}</p><span className="profileOnlineLabel"><i/> АККАУНТ HYPEGO</span></div>
<button type="button" className="profileEditButton" onClick={()=>{setDisplay(user.display_name||user.username);setBio(user.bio||'');setColor(user.nickname_color||'#a78bfa');setVkUrl(user.vk_url||'');setTelegramUsername(user.telegram_username||'');setTab('profile-settings')}} aria-label="Настройки профиля" title="Настройки профиля">⚙ <span>Настроить профиль</span></button>
<div className="profileBadges">{roles.map(r=><span key={r.id}>{r.title}</span>)}</div>
</div>
<div className="profileContentGrid">
<article className="panel profileAbout"><div className="profileCardHeading"><div><div className="eyebrow">PLAYER DATA</div><h3>О себе</h3></div><span className="profileCardIcon">◈</span></div>
<p className="profileBio">{user.bio?.trim()||'Этот игрок пока ничего не рассказал о себе.'}</p>
<div className="profileMeta"><span>ИГРОВОЙ НИК</span><strong>{user.username}</strong></div>
<div className="profileMeta"><span>ОТОБРАЖАЕМОЕ ИМЯ</span><strong style={{color:user.nickname_color}}>{user.display_name||user.username}</strong></div>
{user.vk_url&&<div className="profileMeta"><span>VK</span><a href={user.vk_url} target="_blank" rel="noreferrer">Открыть страницу VK ↗</a></div>}
{user.telegram_username&&<div className="profileMeta"><span>TELEGRAM</span><a href={'https://t.me/'+user.telegram_username} target="_blank" rel="noreferrer">@{user.telegram_username}</a></div>}
</article>
<article className="panel profileWallet"><div className="profileCardHeading"><div><div className="eyebrow">HYPEGO WALLET</div><h3>Мой баланс</h3></div><span className="profileCardIcon">◉</span></div>
<div className="profileWalletAmount">{(Number(user.donation_balance_rub_kopecks||0)/100).toFixed(2)} <span>₽</span></div>
<p className="profileWalletHint">Баланс аккаунта Hypego</p>
<button type="button" className="primary" onClick={()=>setTab('billing')}>＋ Пополнить баланс</button>
<div className="profileMeta profileSalary">
  <span>БАЛАНС ПЕРСОНАЛА</span>
  <strong>{Number(user.hp_balance||0).toLocaleString('ru-RU')} <small>HP</small></strong>
</div>
</article>
<article className="panel profileRoles"><div className="profileCardHeading"><div><div className="eyebrow">ACCOUNT STATUS</div><h3>Мои роли</h3></div><span className="profileCardIcon">✧</span></div>
<div className="profileRoleList">{roles.length?roles.map(r=><span key={r.id}>{r.title}</span>):<p className="profileBio">Стандартный игрок Hypego</p>}</div>
</article>
</div>
</section>}
{tab==='profile-settings'&&user&&<section className="section profileSettingsPage">
<div className="settingsPageHeading"><div><div className="eyebrow">HYPEGO ACCOUNT / SETTINGS</div><h2>Настройки <em>профиля</em></h2><p className="muted">Настрой внешний вид своей страницы игрока.</p></div><button type="button" className="outline" onClick={()=>setTab('profile')}>← Назад в профиль</button></div>
<div className="profileSettingsGrid">
<form className="panel form profileSettingsCard" onSubmit={saveProfile}><div className="profileCardHeading"><div><div className="eyebrow">PERSONAL DATA</div><h3>Личная информация</h3></div><span className="profileCardIcon">◈</span></div>
<label>Отображаемое имя<input value={display} onChange={e=>setDisplay(e.target.value)} maxLength={40} placeholder={user.username}/></label>
<label>О себе<textarea value={bio} onChange={e=>setBio(e.target.value)} maxLength={500} placeholder="Расскажи немного о себе..."/></label>
<label>Ссылка на VK<input type="url" value={vkUrl} onChange={e=>setVkUrl(e.target.value)} maxLength={300} placeholder="https://vk.com/your_page"/></label>
<label>Имя в Telegram<input value={telegramUsername} onChange={e=>setTelegramUsername(e.target.value.replace(/^@/,''))} maxLength={32} placeholder="username без @"/></label>
<label>Цвет ника<div className="colorInput"><input type="color" value={color} onChange={e=>setColor(e.target.value)}/><code>{color.toUpperCase()}</code></div></label>
<div className="profilePreview"><span className="accountAvatar">{user.avatar_url?<img src={user.avatar_url} alt=""/>:(user.username||'H').slice(0,1).toUpperCase()}</span><div><small>ПРЕДПРОСМОТР НИКА</small><strong style={{color}}>{display||user.username}</strong><span>@{user.username}</span></div></div>
<button className="primary big" disabled={busy}>{busy?'Сохраняем…':'Сохранить изменения'}</button>
</form>
<div className="profileSettingsSide">
<div className="panel form profileSettingsCard"><div className="profileCardHeading"><div><div className="eyebrow">VISUAL IDENTITY</div><h3>Оформление</h3></div><span className="profileCardIcon">✧</span></div>
<label>Аватарка<input type="file" accept="image/*" onChange={e=>upload('avatar',e.target.files?.[0])}/></label>
<label>Баннер профиля<input type="file" accept="image/*" onChange={e=>upload('banner',e.target.files?.[0])}/></label>
<p className="tiny">Выбери изображения с устройства. После загрузки данные профиля обновятся.</p>
</div>
<div className="profileSettingsTip"><span>ⓘ</span><p>Имя, описание и цвет ника сохраняются кнопкой «Сохранить изменения». Аватар и баннер загружаются отдельно.</p></div>
</div>
</div>
</section>}
{tab==='shop'&&user&&(store!=='staff'||canAccessStaffShop)&&<section className="section"><div className="sectionHead"><div><div className="eyebrow">HYPEGO STORE</div><h2>Магазин <em>{store==='staff'?'персонала':'проекта'}</em></h2></div><div className="switch"><button className={store==='main'?'selected':''} onClick={()=>setStore('main')}>Основной</button>{canAccessStaffShop&&<button className={store==='staff'?'selected':''} onClick={()=>setStore('staff')}>Персонал</button>}</div></div><div className="notice subtle">Цены и наличие задаются владельцем в админ-панели. Пока не подключён платёжный провайдер, оформление заказа не списывает деньги и не выдаёт предметы на сервере.</div><div className="productGrid">{products.map(p=><article className="product" key={p.id}><div className="productIcon">{p.category==='rank'?'♛':p.category==='consumable'?'▣':p.category==='service'?'✚':p.category==='economy'?'◉':'✧'}</div><span className="category">{p.category.toUpperCase()}</span><h3>{p.name}</h3><p>{p.description}</p><div className="priceLine"><strong>{p.price_cents>0?(p.price_cents/100*(100-p.discount_percent)/100).toFixed(2)+' '+p.currency:'Цена не установлена'}</strong>{p.discount_percent>0&&<span>-{p.discount_percent}%</span>}</div><button className="primary" onClick={()=>buy(p)}>Выбрать товар</button></article>)}</div></section>}
{tab==='billing'&&user&&<section className="panel authPanel"><div className="eyebrow">ACCOUNT BALANCE</div><h2>Пополнение баланса</h2><p className="muted">Доступные валюты интерфейса: KZT, RUB и EUR. Платёжная обработка должна быть подключена к реальному провайдеру.</p><form className="form" onSubmit={async e=>{e.preventDefault();try{await api('billing/topup',{method:'POST',body:JSON.stringify({amount_cents:Math.round(Number(amount)*100),currency})});}catch(err:any){setNotice(err.message)}}}><label>Сумма<input type="number" min="1" max="1000000" step="1" value={amount} onChange={e=>setAmount(e.target.value)}/></label><label>Валюта<select value={currency} onChange={e=>setCurrency(e.target.value)}><option>KZT</option><option>RUB</option><option>EUR</option></select></label><button className="primary big">Перейти к оплате</button></form><p className="tiny">Номер карты, CVV и платёжные данные сайт не принимает и не хранит. Пополнение недоступно, пока администратор не подключит провайдера и проверенный webhook.</p></section>}
{tab==='rules'&&<Rules/>}{tab==='players'&&<Players/>}{tab==='trainee'&&<TraineeApplications user={user} roles={roles} onNotice={setNotice}/ >}{tab==='admin'&&user&&isStaff&&<><Admin roles={roles} onNotice={setNotice}/>{roles.some(r=>r.id==='curator')&&<RulesEditor onNotice={setNotice}/>}<ProductEditor onNotice={setNotice}/></>}
<footer><div className="brand"><span className="brandMark">H</span> HYPEGO</div><span>© {new Date().getFullYear()} Hypego Project</span><span>Игра начинается здесь.</span></footer></main>}

function ServerStatus() {
  const [status, setStatus] = useState<{
    online: boolean;
    playersOnline: number;
    playersMax: number;
    playerList: { name: string }[];
  } | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try {
        const response = await fetch('/api/server-status', { cache: 'no-store' });
        if (!response.ok) throw new Error('Status unavailable');
        const data = await response.json();
        if (active) setStatus(data);
      } catch {
        if (active) setStatus(null);
      } finally {
        if (active) setChecked(true);
      }
    };
    refresh();
    const timer = setInterval(refresh, 60000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  const copyAddress = () => {
    navigator.clipboard?.writeText('hypego.org:19132');
  };

  return (
    <section className="section serverStatusSection">
      <div className="sectionHead">
        <div>
          <div className="eyebrow">HYPEGO NETWORK</div>
          <h2>Статус <em>сервера</em></h2>
        </div>
        <p>Актуальная информация о доступности игрового мира.</p>
      </div>
      <div className="serverStatusCard">
        <div className="serverStatusTop">
          <div className="serverStatusIdentity">
            <div className="serverStatusIcon">H</div>
            <div>
              <strong>Hypego Bedrock</strong>
              <span>МИР MINECRAFT · BEDROCK EDITION</span>
            </div>
          </div>
          <span className={'serverStatusBadge ' + (
            !checked ? 'statusChecking' :
            status === null ? 'statusUnknown' :
            status.online ? 'statusOnline' : 'statusOffline'
          )}>
            <i />
            {!checked ? 'Проверяем…' :
             status === null ? 'Статус недоступен' :
             status.online ? 'Онлайн' : 'Офлайн'}
          </span>
        </div>
        <div className="serverStatusMetrics">
          <div>
            <span>ИГРОКИ ОНЛАЙН</span>
            <strong>{status?.online ? status.playersOnline : 0}
              {status?.online && status.playersMax > 0 ? ` / ${status.playersMax}` : ''}
            </strong>
          </div>
          <div>
            <span>АДРЕС СЕРВЕРА</span>
            <strong className="serverStatusAddress">hypego.org:19132</strong>
          </div>
        </div>
        <div className="serverStatusBottom">
          <div>
            <strong>Игроки на сервере</strong>
            <p>
              {!checked ? 'Получаем данные…' :
               status === null ? 'Не удалось получить данные. Попробуй позже.' :
               !status.online ? 'Сервер сейчас недоступен.' :
               status.playerList.length ? 'Список подключённых игроков:' :
               'Список ников сервер не предоставляет.'}
            </p>
          </div>
          <button className="primary" onClick={copyAddress}>Копировать IP</button>
        </div>
        {status?.online && status.playerList.length > 0 && (
          <div className="serverPlayerList">
            {status.playerList.slice(0, 20).map((player, index) => (
              <span key={player.name + index}><i />{player.name}</span>
            ))}
            {status.playerList.length > 20 && (
              <span>+ ещё {status.playerList.length - 20}</span>
            )}
          </div>
        )}
        <div className="serverStatusFoot">Данные статуса обновляются автоматически · примерно раз в минуту</div>
      </div>
    </section>
  );
}

function Rules(){const [rules,setRules]=useState<any[]>([]);useEffect(()=>{api('rules').then(j=>setRules(j.rules||[])).catch(()=>setRules([]))},[]);return <section className="section"><div className="eyebrow">SURVIVE WITH RESPECT</div><h2>Правила <em>проекта</em></h2>{rules.length?rules.map(r=><article className="rule" key={r.id}><h3>{r.title}</h3><p>{r.body}</p></article>):<div className="panel"><p>Правила пока не опубликованы. После первого входа владельца добавьте их через панель управления.</p></div>}</section>}
function Players(){const [q,setQ]=useState(''),[players,setPlayers]=useState<any[]>([]);async function search(){try{setPlayers((await api('players?q='+encodeURIComponent(q))).players||[])}catch{setPlayers([])}}useEffect(()=>{search()},[]);return <section className="section"><div className="eyebrow">COMMUNITY</div><h2>Игроки <em>Hypego</em></h2><div className="searchLine"><input placeholder="Найти игрока по нику" value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>e.key==='Enter'&&search()}/><button className="primary" onClick={search}>Поиск</button></div><div className="playerGrid">{players.map(p=><article className={"player "+(p.is_chsp?"chspPlayer":"")} key={p.id} role="link" tabIndex={0} style={{cursor:"pointer"}} onClick={()=>window.location.href="/player/"+encodeURIComponent(p.username)} onKeyDown={e=>{if(e.key==="Enter")window.location.href="/player/"+encodeURIComponent(p.username)}}><div className="avatar smallAvatar">{p.avatar_url?<img src={p.avatar_url} alt=""/>:p.username.slice(0,1).toUpperCase()}</div><strong style={{color:p.nickname_color,textDecoration:p.is_chsp?"line-through":undefined}}>{p.display_name||p.username}</strong><span>@{p.username}</span>{p.is_chsp&&<small className="chspBadge">ЧСП</small>}</article>)}</div></section>}

function RulesEditor({onNotice}:{onNotice:(s:string)=>void}) {
  const [rules,setRules]=useState<any[]>([]);
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);

  async function load() {
    setLoading(true);
    try {
      const j=await api('admin/rules');
      setRules(Array.isArray(j.rules)?j.rules:[]);
    } catch(e:any) {
      onNotice('Не удалось загрузить правила: '+e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(()=>{load()},[]);

  function updateRule(index:number,field:'title'|'body',value:string) {
    setRules(current=>current.map((r,i)=>i===index?{...r,[field]:value}:r));
  }

  function addRule() {
    setRules(current=>[...current,{title:'',body:''}]);
  }

  async function save() {
    const valid=rules.filter(r=>String(r.title||'').trim()&&String(r.body||'').trim());
    if(!valid.length) {
      onNotice('Добавь хотя бы одно правило с заголовком и текстом.');
      return;
    }
    setSaving(true);
    try {
      await api('admin/rules',{
        method:'PUT',
        body:JSON.stringify({
          rules:valid.map(r=>({
            ...(r.id?{id:r.id}:{}),
            title:String(r.title).trim(),
            body:String(r.body).trim()
          }))
        })
      });
      onNotice('Правила сохранены.');
      await load();
    } catch(e:any) {
      onNotice('Не удалось сохранить правила: '+e.message);
    } finally {
      setSaving(false);
    }
  }

  return <section className="section">
    <div className="eyebrow">PROJECT CONFIGURATION</div>
    <h2>Редактор <em>правил</em></h2>
    <div className="panel form">
      <p className="muted">Добавляй и редактируй правила проекта. После сохранения они появятся в публичном разделе «Правила».</p>
      {loading?<p>Загрузка правил...</p>:rules.length===0?<p>Правил пока нет. Нажми «Добавить правило», чтобы создать первое.</p>:rules.map((r,i)=><div className="panel form" key={r.id||'new-'+i}>
        <h3>Правило {i+1}</h3>
        <label>Заголовок
          <input value={r.title||''} maxLength={150} onChange={e=>updateRule(i,'title',e.target.value)} placeholder="Например: Уважай других игроков"/>
        </label>
        <label>Текст правила
          <textarea value={r.body||''} maxLength={5000} rows={4} onChange={e=>updateRule(i,'body',e.target.value)} placeholder="Опиши правило и возможные последствия..."/>
        </label>
      </div>)}
      <div className="searchLine">
        <button className="outline" type="button" onClick={addRule} disabled={loading||saving}>Добавить правило</button>
        <button className="primary" type="button" onClick={save} disabled={loading||saving}>{saving?'Сохранение...':'Сохранить правила'}</button>
      </div>
      <p className="tiny">Пустые записи не сохраняются. Удаление правил пока не предусмотрено в этом редакторе.</p>
    </div>
  </section>;
}

function Admin({roles,onNotice}:{roles:any[];onNotice:(s:string)=>void}){
const [users,setUsers]=useState<any[]>([]);
const [q,setQ]=useState('');
const [target,setTarget]=useState('');
const [role,setRole]=useState('trainee');
const [removeRole,setRemoveRole]=useState('');
const [salary,setSalary]=useState('1000');
const [reason,setReason]=useState('Премия персоналу');

const canManage=roles.some(r=>['owner','deputy','management','curator'].includes(r.id));

const selectedUser=users.find(u=>u.id===target);
const selectedUserRoles=(selectedUser?.roles||[]).filter((r:any)=>r.id!=='player');

async function search(){
  try{
    const j=await api('admin/users?q='+encodeURIComponent(q));
    const next=j.users||[];
    setUsers(next);

    if(target&&!next.some((u:any)=>u.id===target)){
      setTarget('');
      setRemoveRole('');
    }
  }catch(e:any){
    onNotice(e.message);
  }
}

useEffect(()=>{
  search();
},[]);

useEffect(()=>{
  if(selectedUserRoles.length===0){
    setRemoveRole('');
  }else if(!selectedUserRoles.some((r:any)=>r.id===removeRole)){
    setRemoveRole(selectedUserRoles[0].id);
  }
},[target,selectedUser?.roles]);

async function assign(){
  if(!target)return;

  try{
    await api('admin/roles',{
      method:'POST',
      body:JSON.stringify({
        user_id:target,
        role_id:role
      })
    });

    onNotice('Роль назначена.');
    await search();
  }catch(e:any){
    onNotice(e.message);
  }
}

async function remove(){
  if(!target||!removeRole)return;

  const roleTitle=selectedUserRoles.find((r:any)=>r.id===removeRole)?.title||removeRole;

  if(!confirm(`Снять с пользователя «${roleTitle}»?`))return;

  try{
    await api('admin/roles',{
      method:'DELETE',
      body:JSON.stringify({
        user_id:target,
        role_id:removeRole
      })
    });

    onNotice('Привилегия снята.');
    setRemoveRole('');
    await search();
  }catch(e:any){
    onNotice(e.message);
  }
}

async function pay(){
  if(!target)return;

  try{
    await api('admin/salary',{
      method:'POST',
      body:JSON.stringify({
        user_id:target,
        amount:Number(salary),
        reason
      })
    });

    onNotice('Внутренний баланс обновлён.');
    await search();
  }catch(e:any){
    onNotice(e.message);
  }
}

async function seed(){
  try{
    const j=await api('products/seed',{method:'POST'});
    onNotice('Каталог инициализирован: '+j.count+' товаров.');
  }catch(e:any){
    onNotice(e.message);
  }
}

return <section className="section">
  <div className="eyebrow">STAFF CONTROL</div>
  <h2>Панель <em>управления</em></h2>

  <div className="adminGrid">

    <div className="panel form">
      <h3>Пользователи и роли</h3>

      <div className="searchLine">
        <input
          value={q}
          onChange={e=>setQ(e.target.value)}
          placeholder="Ник или email"
        />
        <button className="outline" type="button" onClick={search}>
          Найти
        </button>
      </div>

      <div className="userList">
        {users.map(u=>
          <button
            className={'userRow '+(target===u.id?'active':'')}
            key={u.id}
            type="button"
            onClick={()=>{
              setTarget(u.id);
              setRemoveRole('');
            }}
          >
            <strong>{u.username}</strong>
            <span>{u.email}</span>
            <small>
              {(u.roles||[]).map((r:any)=>r.title).join(', ')||'Без дополнительных привилегий'}
            </small>
          </button>
        )}
      </div>

      <label>
        Выбранный пользователь
        <input
          value={selectedUser?.username||''}
          placeholder="Сначала выберите пользователя"
          readOnly
        />
      </label>

      <label>
        Выдать привилегию
        <select
          value={role}
          onChange={e=>setRole(e.target.value)}
          disabled={!target}
        >
          {[
            ['deputy','Заместитель (ОПКА)'],
            ['management','Руководство'],
            ['curator','Куратор'],
            ['tech_admin','Тех. админ'],
            ['support','Тех. поддержка'],
            ['moderator','Модератор'],
            ['trainee','Стажёр'],
            ['player','Игрок'],
            ...(roles.some(r=>r.id==='owner')?[['chsp','ЧСП']]:[])
          ].map(r=>
            <option value={r[0]} key={r[0]}>
              {r[1]}
            </option>
          )}
        </select>
      </label>

      <button
        className="primary"
        type="button"
        disabled={!target}
        onClick={assign}
      >
        Выдать привилегию
      </button>

      <hr/>

      <h3>Снять привилегию</h3>

      {!target&&
        <p className="muted">
          Сначала выберите пользователя из списка выше.
        </p>
      }

      {target&&selectedUserRoles.length===0&&
        <p className="muted">
          У выбранного пользователя нет привилегий, которые можно снять.
        </p>
      }

      {target&&selectedUserRoles.length>0&&<>
        <label>
          Привилегия для снятия
          <select
            value={removeRole}
            onChange={e=>setRemoveRole(e.target.value)}
          >
            {selectedUserRoles.map((r:any)=>
              <option value={r.id} key={r.id}>
                {r.title}
              </option>
            )}
          </select>
        </label>

        <button
          className="outline"
          type="button"
          disabled={!removeRole}
          onClick={remove}
        >
          Снять выбранную привилегию
        </button>
      </>}

      <p className="tiny">
        Выберите игрока, затем его текущую привилегию и нажмите «Снять выбранную привилегию».
        Система дополнительно проверит ваши права.
      </p>
    </div>

    <div className="panel form">
      <h3>Внутренняя зарплата</h3>
      <p className="muted">
        Это непереводимая внутренняя валюта, не деньги и не платёжный баланс.
      </p>

      <label>
        Сумма (+ начисление / − списание)
        <input
          type="number"
          value={salary}
          onChange={e=>setSalary(e.target.value)}
        />
      </label>

      <label>
        Причина
        <input
          value={reason}
          onChange={e=>setReason(e.target.value)}
        />
      </label>

      <button
        className="primary"
        type="button"
        disabled={!target}
        onClick={pay}
      >
        Изменить зарплату
      </button>

      <hr/>

      <h3>Каталог магазина</h3>
      <p className="muted">
        Добавляет список стартовых товаров. После этого задайте цены и скидки через API администрирования.
      </p>

      <button className="outline" type="button" onClick={seed}>
        Инициализировать каталог
      </button>

      <hr/>

      <h3>Служебные разделы</h3>
      <p className="tiny">
        API управления правилами, наказаниями, привилегиями, заказами и журналом действий доступен по защищённым endpoint. Реальная выдача требует Minecraft bridge.
      </p>
    </div>

  </div>
</section>
}

function ProductEditor({onNotice}:{onNotice:(s:string)=>void}){
const [items,setItems]=useState<any[]>([]);
const [busy,setBusy]=useState(false);

async function load(){
setBusy(true);
try{
const j=await api('admin/products');
setItems(j.products||[]);
}catch(e:any){onNotice(e.message)}
finally{setBusy(false)}
}

useEffect(()=>{load()},[]);

async function save(p:any){
try{
const price=Number(p.price_cents);
const discount=Number(p.discount_percent);
const stock=p.stock===''||p.stock===null?null:Number(p.stock);

if(!Number.isSafeInteger(price)||price<0)throw new Error('Некорректная цена');
if(!Number.isInteger(discount)||discount<0||discount>100)throw new Error('Скидка должна быть от 0 до 100');
if(stock!==null&&(!Number.isInteger(stock)||stock<0))throw new Error('Некорректный остаток');

await api('admin/products',{
method:'PATCH',
body:JSON.stringify({id:p.id,price_cents:price,discount_percent:discount,stock,active:Boolean(p.active)})
});
onNotice('Товар сохранён: '+p.name);
await load();
}catch(e:any){onNotice(e.message)}
}

return <section className="panel form" style={{marginTop:24}}>
<h3>Редактор товаров</h3>
<button type="button" className="outline" onClick={load} disabled={busy}>
{busy?'Загрузка…':'Обновить товары'}
</button>
{items.map(p=><article className="panel form" key={p.id} style={{marginTop:16}}>
<h3>{p.name}</h3>
<p className="tiny">{p.store} · {p.category} · {p.currency}</p>
<label>Цена в минимальных единицах
<input type="number" min="0" step="1" value={p.price_cents??0}
onChange={e=>setItems(old=>old.map(x=>x.id===p.id?{...x,price_cents:e.target.value}:x))}/>
</label>
<label>Скидка (%)
<input type="number" min="0" max="100" value={p.discount_percent??0}
onChange={e=>setItems(old=>old.map(x=>x.id===p.id?{...x,discount_percent:e.target.value}:x))}/>
</label>
<label>Остаток (пусто — без ограничения)
<input type="number" min="0" value={p.stock??''}
onChange={e=>setItems(old=>old.map(x=>x.id===p.id?{...x,stock:e.target.value}:x))}/>
</label>
<label>
<input type="checkbox" checked={Boolean(p.active)}
onChange={e=>setItems(old=>old.map(x=>x.id===p.id?{...x,active:e.target.checked}:x))}/>
Товар активен
</label>
<button type="button" className="primary" onClick={()=>save(p)}>Сохранить товар</button>
</article>)}
{!busy&&items.length===0&&<p>Товары не найдены или каталог ещё не создан.</p>}
</section>
}
