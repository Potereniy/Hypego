'use client';
import {useEffect,useRef,useState} from 'react';
import { upload as uploadBlob } from '@vercel/blob/client';
import ProfileMusicSettings from "./player/[username]/ProfileMusicSettings";
import MusicPlayer from "./player/[username]/MusicPlayer";
import TraineeApplications from './trainee-applications';
type User={
  id:string;
  username:string;
  display_name:string;
  avatar_url:string|null;
  banner_url:string|null;
 vk_url:string|null;
 telegram_username:string|null;
  nickname_color:string;
  nickname_effect:string;
  avatar_frame:string;
  bio:string;
  donation_balance_rub_kopecks:string|number;
  hp_balance:string|number;
};
type Product={id:string;name:string;description:string;category:string;store:string;price_cents:number;currency:string;discount_percent:number;requires_staff:boolean};
async function api(url:string,init?:RequestInit){const r=await fetch('/api/'+url,{...init,headers:{'Content-Type':'application/json',...(init?.headers||{})}});const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.error||'Ошибка запроса');return j;}
export default function Home(){const [user,setUser]=useState<User|null>(null),[roles,setRoles]=useState<any[]>([]),[products,setProducts]=useState<Product[]>([]),[tab,setTab]=useState('home'),[profileSection,setProfileSection]=useState('overview'),[openNav,setOpenNav]=useState(''),[store,setStore]=useState('main'),[routeReady,setRouteReady]=useState(false),[login,setLogin]=useState(''),[password,setPassword]=useState(''),[email,setEmail]=useState(''),[mode,setMode]=useState('login'),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false),[display,setDisplay]=useState(''),[bio,setBio]=useState(''),[color,setColor]=useState('#a78bfa'),[nicknameEffect,setNicknameEffect]=useState('none'),[avatarFrame,setAvatarFrame]=useState('none'),[vkUrl,setVkUrl]=useState(''),[telegramUsername,setTelegramUsername]=useState(''),[target,setTarget]=useState(''),[currency,setCurrency]=useState('KZT'),[amount,setAmount]=useState('1000'),[challengeId,setChallengeId]=useState(''),[loginCode,setLoginCode]=useState(''),[forgotMode,setForgotMode]=useState(false),[forgotEmail,setForgotEmail]=useState('');
async function load(){try{const j=await api('me');setUser(j.user);setRoles(j.roles||[]);setDisplay(j.user.display_name||j.user.username);setBio(j.user.bio||'');setColor(j.user.nickname_color||'#a78bfa');setNicknameEffect(j.user.nickname_effect||'none');setAvatarFrame(j.user.avatar_frame||'none');setVkUrl(j.user.vk_url||'');setTelegramUsername(j.user.telegram_username||'');return j.user as User;}catch{setUser(null);setRoles([]);return null;}}
async function loadProducts(s=store){try{const j=await api('products?store='+s);setProducts(j.products||[])}catch(e:any){setNotice(e.message)}}
const routeKeyRef=useRef('home|overview|main'),skipRoutePushRef=useRef(false);
useEffect(()=>{
  const allowed=['home','shop','rules','players','groups','trainee','profile','profile-settings','billing','friends','admin','auth'];
  const readRoute=()=>{
    const params=new URLSearchParams(window.location.search);
    const requested=params.get('tab')||'home';
    const nextTab=allowed.includes(requested)?requested:'home';
    const nextSection=params.get('section')==='wall'?'wall':'overview';
    const nextStore=params.get('store')==='staff'?'staff':'main';
    return {nextTab,nextSection,nextStore};
  };
  const initial=readRoute();
  setTab(initial.nextTab);
  setProfileSection(initial.nextSection);
  setStore(initial.nextStore);
  routeKeyRef.current=initial.nextTab+'|'+initial.nextSection+'|'+initial.nextStore;
  setRouteReady(true);
  const onPopState=()=>{
    const next=readRoute();
    skipRoutePushRef.current=true;
    routeKeyRef.current=next.nextTab+'|'+next.nextSection+'|'+next.nextStore;
    setTab(next.nextTab);
    setProfileSection(next.nextSection);
    setStore(next.nextStore);
    setOpenNav('');
  };
  window.addEventListener('popstate',onPopState);
  return ()=>window.removeEventListener('popstate',onPopState);
},[]);
useEffect(()=>{
  if(!routeReady)return;
  const key=tab+'|'+profileSection+'|'+store;
  if(key===routeKeyRef.current)return;
  routeKeyRef.current=key;
  const url=new URL(window.location.href);
  if(tab==='home')url.searchParams.delete('tab');
  else url.searchParams.set('tab',tab);
  if(profileSection==='wall')url.searchParams.set('section','wall');
  else url.searchParams.delete('section');
  if(store==='staff')url.searchParams.set('store','staff');
  else url.searchParams.delete('store');
  if(skipRoutePushRef.current){
    skipRoutePushRef.current=false;
    window.history.replaceState({},'',url);
  }else{
    window.history.pushState({},'',url);
  }
},[tab,profileSection,store,routeReady]);
useEffect(()=>{load()},[]);
useEffect(()=>{if(user)loadProducts(store)},[user,store]);
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

async function requestPasswordReset(e:React.FormEvent) {
  e.preventDefault();
  setBusy(true);
  setNotice('');
  try {
    const result = await api('auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: forgotEmail.trim() })
    });
    setNotice(result.message || 'Если аккаунт существует, инструкция отправлена на почту.');
  } catch {
    setNotice('Не удалось выполнить запрос. Попробуйте позже.');
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

async function saveProfile(e:React.FormEvent){e.preventDefault();try{await api('profile',{method:'PATCH',body:JSON.stringify({display_name:display,bio,nickname_color:color,nickname_effect:nicknameEffect,avatar_frame:avatarFrame,vk_url:vkUrl,telegram_username:telegramUsername})});await load();setNotice('Профиль сохранён.')}catch(e:any){setNotice(e.message)}}
async function upload(kind:string,file?:File){if(!file)return;const fd=new FormData();fd.set('kind',kind);fd.set('file',file);try{const r=await fetch('/api/profile/upload',{method:'POST',body:fd});const j=await r.json();if(!r.ok)throw new Error(j.error);await load();setNotice('Изображение обновлено.')}catch(e:any){setNotice(e.message)}}
async function buy(p:Product){const mc=prompt('Minecraft-ник, которому выдать товар:',user?.username||'');if(!mc)return;try{const j=await api('orders',{method:'POST',body:JSON.stringify({product_id:p.id,minecraft_username:mc})});setNotice(j.payment?.message||'Заказ создан.');}catch(e:any){setNotice(e.message)}}
async function logout(){await api('auth/logout',{method:'POST'});setUser(null);setRoles([]);setNotice('Вы вышли из аккаунта.');}
async function loadFriends(){
  try {
    const j=await api('friends');
    setFriendData({friends:j.friends||[],incoming:j.incoming||[],outgoing:j.outgoing||[]});
  } catch(e:any) { setNotice(e.message); }
}
async function searchFriends(e:React.FormEvent){
  e.preventDefault();
  const q=friendQuery.trim();
  if(q.length<2){setNotice('Введи минимум 2 символа ника');return;}
  setFriendLoading(true);
  try {
    const j=await api('friends/search?q='+encodeURIComponent(q));
    setFriendResults(j.players||[]);
  } catch(e:any) {setNotice(e.message);}
  finally {setFriendLoading(false);}
}
async function sendFriendRequest(id:string){
  try {
    const j=await api('friends/request',{method:'POST',body:JSON.stringify({user_id:id})});
    setNotice(j.message||'Заявка отправлена');
    await loadFriends();
    if(friendQuery.trim().length>=2){
      const r=await api('friends/search?q='+encodeURIComponent(friendQuery.trim()));
      setFriendResults(r.players||[]);
    }
  } catch(e:any){setNotice(e.message);}
}
async function respondFriend(id:string,action:'accept'|'reject'){
  try {
    await api('friends/respond',{method:'POST',body:JSON.stringify({user_id:id,action})});
    setNotice(action==='accept'?'Заявка принята':'Заявка отклонена');
    await loadFriends();
  } catch(e:any){setNotice(e.message);}
}
async function removeFriend(id:string){
  if(!confirm('Удалить этого игрока из друзей?'))return;
  try {
    await api('friends',{method:'DELETE',body:JSON.stringify({user_id:id})});
    setNotice('Игрок удалён из друзей');
    await loadFriends();
  } catch(e:any){setNotice(e.message);}
}
useEffect(()=>{if(user&&tab==='friends')loadFriends()},[user,tab]);

const isStaff=roles.some(r=>['owner','deputy','management','curator','tech_admin'].includes(r.id));
const canAccessStaffShop=roles.some(r=>['trainee','moderator','support','tech_admin','curator','management','deputy','owner'].includes(r.id));
const [drawerOpen,setDrawerOpen]=useState(false);
const [friendData,setFriendData]=useState<any>({friends:[],incoming:[],outgoing:[]});
const [friendQuery,setFriendQuery]=useState('');
const [friendResults,setFriendResults]=useState<any[]>([]);
const [friendLoading,setFriendLoading]=useState(false);
const [chatMode,setChatMode]=useState(false);
const [selectedChat,setSelectedChat]=useState<any>(null);
const [chatMessages,setChatMessages]=useState<any[]>([]);
const [chatDraft,setChatDraft]=useState('');
const [chatLoading,setChatLoading]=useState(false);
const [chatSending,setChatSending]=useState(false);

async function openDirectChat(p:any){
 setSelectedChat(p);
 setChatMode(true);
 setChatMessages([]);
 setChatDraft('');
 setChatLoading(true);
 try{
  const j=await api('messages?user_id='+encodeURIComponent(p.id));
  setChatMessages(j.messages||[]);
 }catch(e:any){setNotice(e.message);}
 finally{setChatLoading(false);}
}
async function sendDirectMessage(e:any){
 e.preventDefault();
 if(!selectedChat||!chatDraft.trim()||chatSending)return;
 setChatSending(true);
 try{
  await api('messages',{method:'POST',body:JSON.stringify({user_id:selectedChat.id,body:chatDraft.trim()})});
  setChatDraft('');
  const j=await api('messages?user_id='+encodeURIComponent(selectedChat.id));
  setChatMessages(j.messages||[]);
 }catch(e:any){setNotice(e.message);}
 finally{setChatSending(false);}
}


return <main><header className="top"><a className="brand" href="#" onClick={()=>setTab('home')}>
  <span className="brandWord">
    <span className="brandHype">HYPE</span><span className="brandGo">GO</span>
  </span>
</a><nav className="siteNav"><button type="button" onClick={()=>{setTab('home');setOpenNav('')}}>Главная</button><div className="navGroup"><button type="button" className="navGroupTrigger" aria-expanded={openNav==='community'} onClick={()=>setOpenNav(openNav==='community'?'':'community')}>Сообщество⌄</button>{openNav==='community'&&<div className="navDropdown"><button type="button" onClick={()=>{setTab('players');setOpenNav('')}}>Игроки</button><button type="button" onClick={()=>{setTab('groups');setOpenNav('')}}>Наказания</button>{user&&<button type="button" onClick={()=>{setTab('friends');setOpenNav('')}}>Друзья</button>}</div>}</div><div className="navGroup"><button type="button" className="navGroupTrigger" aria-expanded={openNav==='shop'} onClick={()=>setOpenNav(openNav==='shop'?'':'shop')}>Магазин⌄</button>{openNav==='shop'&&<div className="navDropdown"><button type="button" onClick={()=>{setTab('shop');setStore('main');setOpenNav('')}}>Основной магазин</button>{isStaff&&<button type="button" onClick={()=>{setTab('shop');setStore('staff');setOpenNav('')}}>Магазин персонала</button>}</div>}</div><div className="navGroup"><button type="button" className="navGroupTrigger" aria-expanded={openNav==='help'} onClick={()=>setOpenNav(openNav==='help'?'':'help')}>Справка⌄</button>{openNav==='help'&&<div className="navDropdown"><button type="button" onClick={()=>{setTab('rules');setOpenNav('')}}>Правила</button><button type="button" onClick={()=>{setTab('trainee');setOpenNav('')}}>Стажировка</button></div>}</div>{user&&<button type="button" onClick={()=>{setProfileSection('overview');setTab('profile');setOpenNav('')}}>Профиль</button>}{isStaff&&<button type="button" onClick={()=>{setTab('admin');setOpenNav('')}}>Управление</button>}</nav><div className="right">{user?<><div className="headerBalance"><small>БАЛАНС</small><strong>{(Number(user.donation_balance_rub_kopecks||0)/100).toFixed(2)} ₽</strong></div><div className="headerBalance headerHpBalance"><small>HYPE POINTS</small><strong>{Number(user.hp_balance||0).toLocaleString("ru-RU")} HP</strong></div><button type="button" className="accountTrigger" onClick={()=>setDrawerOpen(true)} aria-label="Открыть меню профиля"><span className="accountAvatar">{user.avatar_url?<img src={user.avatar_url} alt=""/>:(user.username||'H').slice(0,1).toUpperCase()}</span><span className="accountIdentity"><strong style={{color:user.nickname_color}}>{user.username}</strong><small>Мой аккаунт</small></span><span className="accountChevron">☰</span></button></>:<button className="primary" onClick={()=>setTab('auth')}>Войти</button>}</div></header>
{drawerOpen&&user&&<div className="drawerLayer"><button type="button" className="drawerScrim" aria-label="Закрыть меню" onClick={()=>setDrawerOpen(false)}></button><aside className="profileDrawer" aria-label="Меню аккаунта"><div className="drawerTop"><span className="eyebrow">HYPEGO / ACCOUNT</span><button type="button" className="drawerClose" onClick={()=>setDrawerOpen(false)}>×</button></div><div className="drawerUser"><div className="drawerAvatar">{user.avatar_url?<img src={user.avatar_url} alt=""/>:(user.username||'H').slice(0,1).toUpperCase()}</div><div><strong style={{color:user.nickname_color}}>{user.display_name||user.username}</strong><small>@{user.username}</small></div></div><div className="drawerBalance"><small>ТВОЙ БАЛАНС</small><strong>{(Number(user.donation_balance_rub_kopecks||0)/100).toFixed(2)} <span>₽</span></strong><button type="button" className="outline" onClick={()=>{setTab('billing');setDrawerOpen(false)}}>＋ Пополнить баланс</button></div><div className="drawerLinks"><span className="drawerLabel">АККАУНТ</span><button type="button" onClick={()=>{setTab('profile');setDrawerOpen(false)}}>◈ <span>Профиль и настройки</span><b>›</b></button><button type="button" onClick={()=>{setTab('players');setDrawerOpen(false)}}>♙ <span>Игроки</span><b>›</b></button>
<button type="button" onClick={()=>{setTab('friends');setDrawerOpen(false)}}>♧ <span>Друзья</span><b>›</b></button>
<button type="button" onClick={()=>{setChatMode(true);setSelectedChat(null);setDrawerOpen(true);loadFriends()}}>✉ <span>Сообщения</span><b>›</b></button>
<button type="button" onClick={()=>{setTab('trainee');setDrawerOpen(false)}}>✧ <span>Стажировка</span><b>›</b></button><button type="button" onClick={()=>{setTab('shop');setStore('main');setDrawerOpen(false)}}>◇ <span>Магазин</span><b>›</b></button><button type="button" onClick={()=>{setTab('rules');setDrawerOpen(false)}}>≡ <span>Правила и справка</span><b>›</b></button>{isStaff&&<><span className="drawerLabel">ПЕРСОНАЛ</span><button type="button" onClick={()=>{setTab('admin');setDrawerOpen(false)}}>⌘ <span>Панель управления</span><b>›</b></button></>}<span className="drawerLabel">СЕАНС</span><button type="button" className="drawerLogout" onClick={()=>{setDrawerOpen(false);logout()}}>↪ <span>Выйти из аккаунта</span></button></div>{chatMode&&<section className="drawerChat">
<div className="profileCardHeading">
<div><div className="eyebrow">HYPEGO MESSAGES</div><h3>{selectedChat?'Переписка':'Твои диалоги'}</h3></div>
<button type="button" className="outline" onClick={()=>{setChatMode(false);setSelectedChat(null)}}>Закрыть</button>
</div>
{!selectedChat?<div className="drawerChatContacts">
<p className="muted">Личные сообщения доступны друзьям.</p>
{friendData.friends.length===0?<p>Пока нет друзей для переписки.</p>:friendData.friends.map((p:any)=><button type="button" className="feature" key={p.id} onClick={()=>openDirectChat(p)}>
<strong>{p.display_name||p.username}</strong><span>@{p.username}</span><span>Открыть переписку →</span>
</button>)}
</div>:<>
<button type="button" className="textButton" onClick={()=>setSelectedChat(null)}>← Все диалоги</button>
<div className="drawerChatHistory" aria-live="polite">
{chatLoading?<p>Загружаем сообщения…</p>:chatMessages.length===0?<p>Начни переписку первым!</p>:chatMessages.map((m:any)=><article key={m.id} className="feature" style={{marginBottom:8,overflowWrap:'anywhere'}}>
<strong>{m.sender_id===user.id?'Ты':m.sender_display_name||m.sender_username||selectedChat.username}</strong>
<p style={{whiteSpace:'pre-wrap'}}>{m.body}</p>
<small>{m.created_at?new Date(m.created_at).toLocaleString('ru-RU'):''}</small>
</article>)}
</div>
<form className="form" onSubmit={sendDirectMessage}>
<textarea value={chatDraft} onChange={e=>setChatDraft(e.target.value)} maxLength={2000} placeholder="Напиши сообщение…" required/>
<button className="primary" disabled={chatSending||!chatDraft.trim()||chatLoading}>{chatSending?'Отправляем…':'Отправить'}</button>
</form>
</>}
</section>}
<div className="drawerFooter">HYPEGO · ИГРОВОЙ ПОРТАЛ</div></aside></div>}
{notice&&<div className="notice" role="status">{notice}<button onClick={()=>setNotice('')}>×</button></div>}
{tab==='home'&&<><section className="hero"><div className="heroContent"><div className="eyebrow"><span className="pulse"/> MINECRAFT NETWORK · HYPEGO</div><h1>ТВОЯ ИГРА.<br/><em>ТВОИ ПРАВИЛА.</em></h1><p>Залетай в мир Hypego — играй с друзьями, собирай привилегии и создавай собственную историю.</p><div className="heroActions"><button className="primary big" onClick={()=>setTab(user?'shop':'auth')}>{user?'Открыть магазин':'Начать играть'} <b>↗</b></button><button className="outline big" onClick={()=>setTab('rules')}>Правила проекта</button></div><div className="serverAddress"><span className="serverDot"/><div><small>АДРЕС СЕРВЕРА</small><strong>hypego.org:19132</strong></div><button onClick={()=>{navigator.clipboard?.writeText('hypego.org:19132');setNotice('Адрес скопирован.')}}>Копировать</button></div></div><div className="heroArt"><div className="ring ring1"/><div className="ring ring2"/><div className="cube">H</div><div className="floatTag tagOne">✦ <span>YOUR WORLD</span></div><div className="floatTag tagTwo">⚡ <span>HYPEGO NETWORK</span></div></div></section><ServerStatus/><section className="stats"><div><strong>01</strong><span>ЕДИНЫЙ ПРОФИЛЬ</span></div><div><strong>∞</strong><span>ВОЗМОЖНОСТЕЙ</span></div><div><strong>24/7</strong><span>ТВОЯ ИСТОРИЯ</span></div><div><strong>H+</strong><span>HYPEGO COMMUNITY</span></div></section><section className="section"><div className="sectionHead"><div><div className="eyebrow">ТВОЯ ПЛАТФОРМА</div><h2>Всё для игры — <em>в одном месте</em></h2></div><p>Управляй профилем, изучай товары и следи за новостями проекта.</p></div><div className="featureGrid"><article className="feature"><span>◈</span><h3>Профиль игрока</h3><p>Аватар, баннер, цвет ника, история и персональная страница.</p><button onClick={()=>setTab(user?'profile':'auth')}>Открыть профиль ↗</button></article><article className="feature"><span>✧</span><h3>Магазин Hypego</h3><p>Привилегии, расходники, услуги и игровые улучшения.</p><button onClick={()=>setTab(user?'shop':'auth')}>Перейти в магазин ↗</button></article><article className="feature"><span>⌘</span><h3>Сообщество</h3><p>Находи игроков, знакомься и оставайся частью проекта.</p><button onClick={()=>setTab('players')}>Найти игроков ↗</button></article><article className="feature"><span>↗</span><h3>HYPEGO / SOCIALS</h3><p>Новости, общение и события проекта — присоединяйся к нашему сообществу.</p><div className="socialLinks"><a href="https://discord.gg/9kqv3Fg8Y5" target="_blank" rel="noreferrer">Discord ↗</a><a href="https://vk.ru/hypego" target="_blank" rel="noreferrer">ВКонтакте ↗</a><a href="https://t.me/hypego_news" target="_blank" rel="noreferrer">Telegram ↗</a></div></article></div></section></>}
{tab==='auth'&&<section className="panel authPanel"><div className="eyebrow">HYPEGO ACCOUNT</div><h2>{mode==='login'?'С возвращением':'Создать аккаунт'}</h2><p className="muted">Один аккаунт для профиля и сервисов проекта.</p>{!challengeId&&!forgotMode&&<form onSubmit={auth} className="form"> <label>{mode==='login'?'Никнейм или email':'Никнейм'}<input value={login} onChange={e=>setLogin(e.target.value)} required autoComplete="username"/></label>{mode==='register'&&<label>Email<input type="email" value={email} onChange={e=>setEmail(e.target.value)} required autoComplete="email"/></label>}<label>Пароль<input type="password" value={password} onChange={e=>setPassword(e.target.value)} required minLength={10} autoComplete={mode==='login'?'current-password':'new-password'}/></label><button className="primary big" disabled={busy}>{busy?'Подождите…':mode==='login'?'Войти':'Зарегистрироваться'}</button></form>}
{forgotMode&&<form onSubmit={requestPasswordReset} className="form"><label>Email аккаунта<input type="email" value={forgotEmail} onChange={e=>setForgotEmail(e.target.value)} required autoComplete="email" placeholder="you@example.com"/></label><button className="primary big" disabled={busy}>{busy?'Отправляем…':'Отправить ссылку на почту'}</button><button type="button" className="textButton" disabled={busy} onClick={()=>{setForgotMode(false);setNotice('')}}>Вернуться ко входу</button></form>}{challengeId&&<form onSubmit={verifyLoginCode} className="form"><label>Код входа из письма<input inputMode="numeric" autoComplete="one-time-code" value={loginCode} onChange={e=>setLoginCode(e.target.value.replace(/\D/g,'').slice(0,6))} required minLength={6} maxLength={6} placeholder="123456"/></label><button className="primary big" disabled={busy||loginCode.length!==6}>{busy?'Проверяем…':'Подтвердить вход'}</button><button type="button" className="textButton" disabled={busy} onClick={()=>{setChallengeId('');setLoginCode('');setNotice('Войдите заново, чтобы получить новый код.')}}>Вернуться ко входу</button></form>}
{mode==='login'&&!challengeId&&!forgotMode&&<button type="button" className="textButton" disabled={busy} onClick={()=>{setForgotEmail(login.includes('@')?login:'');setForgotMode(true);setNotice('')}}>Забыл пароль?</button>}
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
  <div className={`avatar avatar-frame-${user.avatar_frame||"none"}`}>
    {user.avatar_url?<img src={user.avatar_url} alt="Аватар"/>:user.username.slice(0,1).toUpperCase()}
  </div>

  <div className="profileBannerIdentity">
    <div className="eyebrow"><span className="pulse"/> HYPEGO / PROFILE</div>
    <h2 className={`nickname-effect-${user.nickname_effect||"none"}`} style={{color:user.nickname_color}}>{user.display_name||user.username}</h2>
    <p>@{user.username}</p>
    <span className="profileOnlineLabel"><i/> АККАУНТ HYPEGO</span>
  </div>

  <button
    type="button"
    className="profileEditButton"
    onClick={()=>{
      setDisplay(user.display_name||user.username);
      setBio(user.bio||'');
      setColor(user.nickname_color||'#a78bfa');setNicknameEffect(user.nickname_effect||'none');setAvatarFrame(user.avatar_frame||'none');
      setVkUrl(user.vk_url||'');
      setTelegramUsername(user.telegram_username||'');
      setTab('profile-settings');
    }}
    aria-label="Настройки профиля"
    title="Настройки профиля"
  >
    ⚙ <span>Настроить профиль</span>
  </button>

  <div className="profileBadges">
    {roles.length
      ? roles.map(r=><span key={r.id}>{r.title}</span>)
      : <span>Игрок</span>
    }
  </div>
</div>
<div className="profileMusicSection">
  <MusicPlayer username={user.username} />
</div>

<div className="profileTabs"><button type="button" className={profileSection==='overview'?'selected':''} onClick={()=>setProfileSection('overview')}>Общая информация</button><button type="button" onClick={()=>setTab('profile-settings')}>Личные данные</button><button type="button" onClick={()=>{setTab('shop');setStore('main')}}>Привилегии</button><button type="button" className={profileSection==='wall'?'selected':''} onClick={()=>setProfileSection('wall')}>Стена</button></div>

<div className={"profileContentGrid " + (profileSection === 'wall' ? 'profileContentGridHidden' : '')}>

  <article className="panel profileAbout">
    <div className="profileCardHeading">
      <div>
        <div className="eyebrow">GENERAL INFORMATION</div>
        <h3>Общая информация</h3>
      </div>
      <span className="profileCardIcon">◈</span>
    </div>

    <div className="profileInfoList">
      <div className="profileMeta">
        <span>ID</span>
        <strong>{user.id}</strong>
      </div>

      <div className="profileMeta">
        <span>ГРУППА</span>
        <strong>{roles.length?roles.map(r=>r.title).join(', '):'Игрок'}</strong>
      </div>

      <div className="profileMeta">
        <span>НИК</span>
        <strong style={{color:user.nickname_color}}>{user.username}</strong>
      </div>

      <div className="profileMeta">
        <span>ОТОБРАЖАЕМОЕ ИМЯ</span>
        <strong>{user.display_name||user.username}</strong>
      </div>

      <div className="profileMeta">
        <span>ПРЕФИКС</span>
        <strong>HYPEGO</strong>
      </div>
    </div>
  </article>

  <article className="panel profileWallet">
    <div className="profileCardHeading">
      <div>
        <div className="eyebrow">HYPEGO WALLET</div>
        <h3>Баланс</h3>
      </div>
      <span className="profileCardIcon">◉</span>
    </div>

    <div className="profileWalletAmount">
      {(Number(user.donation_balance_rub_kopecks||0)/100).toFixed(2)}
      <span> ₽</span>
    </div>

    <p className="profileWalletHint">Баланс аккаунта Hypego</p>

    <button
      type="button"
      className="primary"
      onClick={()=>setTab('billing')}
    >
      ＋ Пополнить баланс
    </button>

    <div className="profileMeta profileSalary">
      <span>БАЛАНС ПЕРСОНАЛА</span>
      <strong>
        {Number(user.hp_balance||0).toLocaleString('ru-RU')}
        <small> HP</small>
      </strong>
    </div>
  </article>

  <article className="panel profileRoles">
    <div className="profileCardHeading">
      <div>
        <div className="eyebrow">PRIVILEGES</div>
        <h3>Мои привилегии</h3>
      </div>
      <span className="profileCardIcon">✧</span>
    </div>

    {roles.length
      ? <div className="profileRoleList">
          {roles.map(r=>
            <span key={r.id}>{r.title}</span>
          )}
        </div>
      : <p className="profileBio">Привилегий нет</p>
    }
  </article>

  <article className="panel profileAbout">
    <div className="profileCardHeading">
      <div>
        <div className="eyebrow">PERSONAL DATA</div>
        <h3>Личные данные</h3>
      </div>
      <span className="profileCardIcon">◎</span>
    </div>

    <p className="profileBio">
      {user.bio?.trim()||'Пользователь пока ничего не рассказал о себе.'}
    </p>

    {user.vk_url&&
      <div className="profileMeta">
        <span>VK</span>
        <a href={user.vk_url} target="_blank" rel="noreferrer">
          Открыть страницу VK ↗
        </a>
      </div>
    }

    {user.telegram_username&&
      <div className="profileMeta">
        <span>TELEGRAM</span>
        <a href={'https://t.me/'+user.telegram_username} target="_blank" rel="noreferrer">
          @{user.telegram_username}
        </a>
      </div>
    }

    <button
      type="button"
      className="outline"
      onClick={()=>setTab('profile-settings')}
    >
      Редактировать личные данные
    </button>
  </article>
</div>{profileSection==='wall'&&<ProfileWall userId={user.id}/>}</section>}
{tab==='profile-settings'&&user&&<section className="section profileSettingsPage">
<div className="settingsPageHeading"><div><div className="eyebrow">HYPEGO ACCOUNT / SETTINGS</div><h2>Настройки <em>профиля</em></h2><p className="muted">Настрой внешний вид своей страницы игрока.</p></div><button type="button" className="outline" onClick={()=>setTab('profile')}>← Назад в профиль</button></div>
<div className="profileSettingsGrid">
<form className="panel form profileSettingsCard" onSubmit={saveProfile}><div className="profileCardHeading"><div><div className="eyebrow">PERSONAL DATA</div><h3>Личная информация</h3></div><span className="profileCardIcon">◈</span></div>
<label>Отображаемое имя<input value={display} onChange={e=>setDisplay(e.target.value)} maxLength={40} placeholder={user.username}/></label>
<label>О себе<textarea value={bio} onChange={e=>setBio(e.target.value)} maxLength={500} placeholder="Расскажи немного о себе..."/></label>
<label>Ссылка на VK<input type="url" value={vkUrl} onChange={e=>setVkUrl(e.target.value)} maxLength={300} placeholder="https://vk.com/your_page"/></label>
<label>Имя в Telegram<input value={telegramUsername} onChange={e=>setTelegramUsername(e.target.value.replace(/^@/,''))} maxLength={32} placeholder="username без @"/></label>
<label>Цвет ника<div className="colorInput"><input type="color" value={color} onChange={e=>setColor(e.target.value)}/><code>{color.toUpperCase()}</code></div></label>
<label>Эффект ника<select value={nicknameEffect} onChange={e=>setNicknameEffect(e.target.value)}><option value="none">Обычный</option><option value="gradient">Градиент</option><option value="neon">Неон</option><option value="rgb">RGB</option></select></label>
<label>Рамка аватара<select value={avatarFrame} onChange={e=>setAvatarFrame(e.target.value)}><option value="none">Без рамки</option><option value="purple">Фиолетовая</option><option value="neon">Неоновая</option><option value="fire">Огненная</option><option value="electric">Электрическая</option>
<option value="gold">Золотая</option>
<option value="red">Красная</option>
<option value="blue">Синяя</option>
<option value="emerald">Изумрудная</option>
<option value="rgb">RGB — переливы</option>
<option value="pulse">Пульсирующий неон</option>
<option value="cosmic">Космическая энергия</option>
</select></label>
<div className="profilePreview"><span className={`accountAvatar avatar-frame-${avatarFrame}`}>{user.avatar_url?<img src={user.avatar_url} alt=""/>:(user.username||'H').slice(0,1).toUpperCase()}</span><div><small>ПРЕДПРОСМОТР НИКА</small><strong className={`nickname-effect-${nicknameEffect}`} style={{color}}>{display||user.username}</strong><span>@{user.username}</span></div></div>
<button className="primary big" disabled={busy}>{busy?'Сохраняем…':'Сохранить изменения'}</button>
</form>
<div className="profileSettingsSide">
<div className="panel form profileSettingsCard"><div className="profileCardHeading"><div><div className="eyebrow">VISUAL IDENTITY</div><h3>Оформление</h3></div><span className="profileCardIcon">✧</span></div>
<label>Аватарка<input type="file" accept="image/*" onChange={e=>upload('avatar',e.target.files?.[0])}/></label>
<label>Баннер профиля<input type="file" accept="image/*" onChange={e=>upload('banner',e.target.files?.[0])}/></label>
<p className="tiny">Выбери изображения с устройства. После загрузки данные профиля обновятся.</p>
</div>
<ProfileMusicSettings username={user.username} />
<MusicPlayer username={user.username} />
<div className="profileSettingsTip"><span>ⓘ</span><p>Имя, описание и цвет ника сохраняются кнопкой «Сохранить изменения». Аватар и баннер загружаются отдельно.</p></div>
</div>
</div>
</section>}
{tab==='shop'&&user&&(store!=='staff'||canAccessStaffShop)&&<section className="section"><div className="sectionHead"><div><div className="eyebrow">HYPEGO STORE</div><h2>Магазин <em>{store==='staff'?'персонала':'проекта'}</em></h2></div><div className="switch"><button className={store==='main'?'selected':''} onClick={()=>setStore('main')}>Основной</button>{canAccessStaffShop&&<button className={store==='staff'?'selected':''} onClick={()=>setStore('staff')}>Персонал</button>}</div></div><div className="notice subtle">Цены и наличие задаются владельцем в админ-панели. Пока не подключён платёжный провайдер, оформление заказа не списывает деньги и не выдаёт предметы на сервере.</div><div className="productGrid">{products.map(p=><article className="product" key={p.id}><div className="productIcon">{p.category==='rank'?'♛':p.category==='consumable'?'▣':p.category==='service'?'✚':p.category==='economy'?'◉':'✧'}</div><span className="category">{p.category.toUpperCase()}</span><h3>{p.name}</h3><p>{p.description}</p><div className="priceLine"><strong>{p.price_cents>0?(p.price_cents/100*(100-p.discount_percent)/100).toFixed(2)+' '+p.currency:'Цена не установлена'}</strong>{p.discount_percent>0&&<span>-{p.discount_percent}%</span>}</div><button className="primary" onClick={()=>buy(p)}>Выбрать товар</button></article>)}</div></section>}
{tab==='billing'&&user&&<section className="panel authPanel"><div className="eyebrow">ACCOUNT BALANCE</div><h2>Пополнение баланса</h2><p className="muted">Доступные валюты интерфейса: KZT, RUB и EUR. Платёжная обработка должна быть подключена к реальному провайдеру.</p><form className="form" onSubmit={async e=>{e.preventDefault();try{await api('billing/topup',{method:'POST',body:JSON.stringify({amount_cents:Math.round(Number(amount)*100),currency})});}catch(err:any){setNotice(err.message)}}}><label>Сумма<input type="number" min="1" max="1000000" step="1" value={amount} onChange={e=>setAmount(e.target.value)}/></label><label>Валюта<select value={currency} onChange={e=>setCurrency(e.target.value)}><option>KZT</option><option>RUB</option><option>EUR</option></select></label><button className="primary big">Перейти к оплате</button></form><p className="tiny">Номер карты, CVV и платёжные данные сайт не принимает и не хранит. Пополнение недоступно, пока администратор не подключит провайдера и проверенный webhook.</p></section>}

{tab==='friends'&&user&&<section className="section">
  <div className="sectionHead">
    <div><div className="eyebrow">HYPEGO COMMUNITY</div><h2>Мои <em>друзья</em></h2></div>
    <button className="outline" onClick={loadFriends}>↻ Обновить</button>
  </div>

  <article className="panel form">
    <h3>Найти игрока</h3>
    <form onSubmit={searchFriends} className="form">
      <label>Никнейм игрока
        <input value={friendQuery} onChange={e=>setFriendQuery(e.target.value)} maxLength={24} minLength={2} placeholder="Например, Marfeiy" />
      </label>
      <button className="primary" disabled={friendLoading}>{friendLoading?'Ищем…':'Поиск игроков'}</button>
    </form>
    {friendResults.length>0&&<div className="featureGrid">
      {friendResults.map((p:any)=><article className="feature" key={p.id}>
        <div className="accountAvatar">{p.avatar_url?<img src={p.avatar_url} alt=""/>:(p.username||'?').slice(0,1).toUpperCase()}</div>
        <h3 style={{color:p.nickname_color||'inherit'}}>{p.display_name||p.username}</h3>
        <p>@{p.username}</p>
        {p.friendship_status==='accepted'?<span>✓ Уже в друзьях</span>:
         p.friendship_status==='outgoing'?<span>Заявка отправлена</span>:
         p.friendship_status==='incoming'?<button className="primary" onClick={()=>respondFriend(p.id,'accept')}>Принять заявку</button>:
         <button className="primary" onClick={()=>sendFriendRequest(p.id)}>＋ Добавить в друзья</button>}
      </article>)}
    </div>}
    {friendQuery.trim().length>=2&&friendResults.length===0&&!friendLoading&&<p className="muted">Результатов пока нет. Выполни поиск.</p>}
  </article>

  <div className="featureGrid">
    <article className="panel">
      <div className="eyebrow">INCOMING</div><h3>Входящие заявки ({friendData.incoming.length})</h3>
      {friendData.incoming.length===0?<p className="muted">Новых заявок нет.</p>:friendData.incoming.map((p:any)=><div className="profilePreview" key={p.id}>
        <div className="accountAvatar">{p.avatar_url?<img src={p.avatar_url} alt=""/>:(p.username||'?').slice(0,1).toUpperCase()}</div>
        <div><strong>{p.display_name||p.username}</strong><span>@{p.username}</span></div>
        <button className="primary" onClick={()=>respondFriend(p.id,'accept')}>Принять</button>
        <button className="outline" onClick={()=>respondFriend(p.id,'reject')}>Отклонить</button>
      </div>)}
    </article>
    <article className="panel">
      <div className="eyebrow">OUTGOING</div><h3>Исходящие заявки ({friendData.outgoing.length})</h3>
      {friendData.outgoing.length===0?<p className="muted">Отправленных заявок нет.</p>:friendData.outgoing.map((p:any)=><div className="profilePreview" key={p.id}>
        <div className="accountAvatar">{p.avatar_url?<img src={p.avatar_url} alt=""/>:(p.username||'?').slice(0,1).toUpperCase()}</div>
        <div><strong>{p.display_name||p.username}</strong><span>@{p.username}</span></div>
        <span className="muted">Ожидает ответа</span>
      </div>)}
    </article>
  </div>

  <article className="panel">
    <div className="eyebrow">FRIENDS LIST</div><h3>Мои друзья ({friendData.friends.length})</h3>
    {friendData.friends.length===0?<p className="muted">Пока нет друзей. Найди игроков и отправь им заявку.</p>:<div className="featureGrid">
      {friendData.friends.map((p:any)=><article className="feature" key={p.id}>
        <div className="accountAvatar">{p.avatar_url?<img src={p.avatar_url} alt=""/>:(p.username||'?').slice(0,1).toUpperCase()}</div>
        <h3 style={{color:p.nickname_color||'inherit'}}>{p.display_name||p.username}</h3>
        <p>@{p.username}</p>
        <button className="outline" onClick={()=>removeFriend(p.id)}>Удалить из друзей</button>
      </article>)}
    </div>}
  </article>
</section>}

{tab==='rules'&&<Rules/>}{tab==='groups'&&<Punishments user={user} roles={roles} onNotice={setNotice}/>}{tab==='players'&&<Players/>}{tab==='trainee'&&<TraineeApplications user={user} roles={roles} onNotice={setNotice}/ >}{tab==='admin'&&user&&isStaff&&<><Admin roles={roles} onNotice={setNotice}/>{roles.some(r=>r.id==='curator')&&<RulesEditor onNotice={setNotice}/>}<ProductEditor onNotice={setNotice}/></>}
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

function ProfileWall({userId}:{userId:string}) {
  const [posts,setPosts] = useState<any[]>([]);
  const [message,setMessage] = useState('');
  const [loading,setLoading] = useState(true);
  const [sending,setSending] = useState(false);
  const [error,setError] = useState('');

  async function loadWall() {
    try {
      const r = await fetch('/api/wall?user_id='+encodeURIComponent(userId), {credentials:'same-origin'});
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Не удалось загрузить стену');
      setPosts(j.posts || []);
      setError('');
    } catch(e:any) {
      setError(e.message || 'Ошибка загрузки стены');
    } finally {
      setLoading(false);
    }
  }

  useEffect(()=>{loadWall()},[userId]);

  async function sendMessage(e:any) {
    e.preventDefault();
    const body = message.trim();
    if (!body || sending) return;
    setSending(true);
    setError('');
    try {
      const r = await fetch('/api/wall', {
        method:'POST',
        credentials:'same-origin',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({user_id:userId,body})
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Не удалось отправить сообщение');
      setMessage('');
      await loadWall();
    } catch(e:any) {
      setError(e.message || 'Ошибка отправки');
    } finally {
      setSending(false);
    }
  }

  return <article className="panel profileWall">
    <div className="eyebrow">COMMUNITY</div>
    <h2>Стена <em>профиля</em></h2>
    <form onSubmit={sendMessage} className="profileWallForm">
      <textarea value={message} onChange={e=>setMessage(e.target.value)}
        maxLength={500} rows={3} placeholder="Оставить сообщение на своей стене..." />
      <div className="profileWallFormBottom">
        <small>{message.length}/500</small>
        <button type="submit" className="primary" disabled={!message.trim()||sending}>
          {sending?'Отправка...':'Опубликовать'}
        </button>
      </div>
    </form>
    {error && <p role="alert">{error}</p>}
    {loading ? <p>Загрузка сообщений...</p> :
      posts.length===0 ? <p className="profileWallEmpty">Пока сообщений нет. Здесь появятся записи на стене.</p> :
      <div className="profileWallPosts">{posts.map((post:any)=>
        <div className="profileWallPost" key={post.id}>
          <div className={'avatar smallAvatar avatar-frame-'+(post.avatar_frame||'none')}>
            {post.avatar_url ? <img src={post.avatar_url} alt="" /> : (post.display_name||post.username||'?').slice(0,1).toUpperCase()}
          </div>
          <div className="profileWallPostContent">
            <strong className={'nickname-effect-'+(post.nickname_effect||'none')}
              style={{color:post.nickname_color||undefined}}>
              {post.display_name||post.username}
            </strong>
            <p>{post.body}</p>
            <small>{post.created_at ? new Date(post.created_at).toLocaleString() : ''}</small>
          </div>
        </div>
      )}</div>
    }
  </article>;
}

function Players(){const [q,setQ]=useState(''),[players,setPlayers]=useState<any[]>([]);async function search(){try{setPlayers((await api('players?q='+encodeURIComponent(q))).players||[])}catch{setPlayers([])}}useEffect(()=>{search()},[]);return <section className="section"><div className="eyebrow">COMMUNITY</div><h2>Игроки <em>Hypego</em></h2><div className="searchLine"><input placeholder="Найти игрока по нику" value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>e.key==='Enter'&&search()}/><button className="primary" onClick={search}>Поиск</button></div><div className="playerGrid">{players.map(p=><article className={"player "+(p.is_chsp?"chspPlayer":"")} key={p.id} role="link" tabIndex={0} style={{cursor:"pointer"}} onClick={()=>window.location.href="/player/"+encodeURIComponent(p.username)} onKeyDown={e=>{if(e.key==="Enter")window.location.href="/player/"+encodeURIComponent(p.username)}}><div className={`avatar smallAvatar avatar-frame-${p.avatar_frame||"none"}`}>{p.avatar_url?<img src={p.avatar_url} alt=""/>:p.username.slice(0,1).toUpperCase()}</div><strong className={`nickname-effect-${p.nickname_effect||"none"}`} style={{color:p.nickname_color,textDecoration:p.is_chsp?"line-through":undefined}}>{p.display_name||p.username}</strong><span>@{p.username}</span>{p.is_chsp&&<small className="chspBadge">ЧСП</small>}</article>)}</div></section>}

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



function Punishments({user,roles,onNotice}:{user:User|null;roles:any[];onNotice:(s:string)=>void}) {
  const [kind,setKind]=useState('ban');
  const [items,setItems]=useState<any[]>([]);
  const [evidence,setEvidence]=useState<Record<string,any[]>>({});
  const [linkUrls,setLinkUrls]=useState<Record<string,string>>({});
  const [loading,setLoading]=useState(false);
  const [uploading,setUploading]=useState<string|null>(null);
  const [editing,setEditing]=useState<string|null>(null);
  const [reason,setReason]=useState('');
  const [expires,setExpires]=useState('');

  async function refresh() {
    setLoading(true);
    try {
      const j=await api('punishments?kind='+kind);
      const rows=j.punishments||[];
      setItems(rows);
      const loaded=await Promise.all(rows.map(async (item:any)=>{
        try {
          const ev=await api('punishments/evidence?punishment_id='+encodeURIComponent(item.id));
          return [item.id,ev.evidence||[]] as [string,any[]];
        } catch {
          return [item.id,[]] as [string,any[]];
        }
      }));
      setEvidence(Object.fromEntries(loaded));
    } catch(e:any) {
      onNotice(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(()=>{
    setEditing(null);
    refresh();
  },[kind]);

  async function save(id:string) {
    try {
      await api('admin/punishments',{
        method:'PATCH',
        body:JSON.stringify({
          id,
          reason:reason.trim(),
          expires_at:expires ? new Date(expires).toISOString() : null
        })
      });
      onNotice('Наказание обновлено');
      setEditing(null);
      await refresh();
    } catch(e:any) {
      onNotice(e.message);
    }
  }

  async function addLink(id:string) {
    const url=(linkUrls[id]||'').trim();
    if(!url) {
      onNotice('Укажи ссылку на доказательство');
      return;
    }
    try {
      const form=new FormData();
      form.set('punishment_id',id);
      form.set('url',url);
      const response=await fetch('/api/admin/punishments/evidence',{method:'POST',body:form});
      const result=await response.json().catch(()=>({}));
      if(!response.ok) throw new Error(result.error||'Не удалось добавить ссылку');
      setLinkUrls(prev=>({...prev,[id]:''}));
      onNotice('Ссылка на доказательство добавлена');
      await refresh();
    } catch(e:any) {
      onNotice(e.message);
    }
  }

  async function uploadEvidence(item:any,file?:File) {
    if(!file) return;
    const images=['image/jpeg','image/png','image/webp','image/gif'];
    const videos=['video/mp4','video/webm','video/quicktime'];
    if(!images.includes(file.type.toLowerCase())&&!videos.includes(file.type.toLowerCase())) {
      onNotice('Поддерживаются JPG, PNG, WEBP, GIF, MP4, WEBM и MOV');
      return;
    }
    if(file.size<1||file.size>200*1024*1024) {
      onNotice('Размер файла должен быть от 1 байта до 200 МБ');
      return;
    }
    setUploading(item.id);
    try {
      await uploadBlob(
        'punishments/'+item.id+'/'+file.name,
        file,
        {
          access:'public',
          handleUploadUrl:'/api/admin/punishments/evidence/upload',
          clientPayload:JSON.stringify({punishmentId:item.id})
        }
      );
      const ev=await api('punishments/evidence?punishment_id='+encodeURIComponent(item.id));
      setEvidence(prev=>({...prev,[item.id]:ev.evidence||[]}));
      onNotice('Доказательство загружено');
    } catch(e:any) {
      onNotice(e.message||'Не удалось загрузить доказательство');
    } finally {
      setUploading(null);
    }
  }

  const privileged=roles.some(r=>r.id==='owner'||r.id==='curator');
  const labels:Record<string,string>={ban:'Баны',mute:'Муты',warn:'Предупреждения'};

  return <section className="section">
    <div className="eyebrow">HYPEGO / MODERATION</div>
    <h2>Группы <em>наказаний</em></h2>
    <p className="muted">История наказаний игроков Minecraft. Список и доказательства доступны всем.</p>
    <div className="searchLine">
      {(['ban','mute','warn'] as const).map(k=>
        <button key={k} className={kind===k?'primary':'outline'} onClick={()=>setKind(k)}>
          {labels[k]}
        </button>
      )}
      <button className="outline" onClick={refresh}>Обновить ↻</button>
    </div>
    {loading&&<p className="muted">Загружаем наказания…</p>}
    {!loading&&!items.length&&<article className="panel"><p>Записей пока нет.</p></article>}
    <div className="playerGrid">
      {items.map(item=>{
        const canEdit=!!user&&(privileged||item.actor_username===user.username);
        const files=evidence[item.id]||[];
        return <article className="panel" key={item.id}>
          <div className="eyebrow">{labels[item.kind]||item.kind}</div>
          <h3>{item.target_username}</h3>
          <p><strong>Причина:</strong> {item.reason}</p>
          <p><strong>Выдал:</strong> {item.actor_username}</p>
          <p><strong>Дата:</strong> {new Date(item.created_at).toLocaleString('ru-RU')}</p>
          <p><strong>Срок:</strong> {item.expires_at?new Date(item.expires_at).toLocaleString('ru-RU'):'Не указан'}</p>

          <div className="evidence">
            <h4>Доказательства ({files.length})</h4>
            {!files.length&&<p className="muted">Доказательства пока не добавлены.</p>}
            {files.map((ev:any)=><div key={ev.id} className="evidenceItem">
              {ev.kind==='image'?
                <a href={ev.url} target="_blank" rel="noreferrer">
                  <img src={ev.url} alt={ev.filename||'Доказательство'} loading="lazy" style={{maxWidth:'100%',maxHeight:320,objectFit:'contain',borderRadius:10}}/>
                </a>:
                ev.kind==='video'?
                  <video src={ev.url} controls preload="metadata" style={{width:'100%',maxHeight:360,borderRadius:10}}/>:
                  <a href={ev.url} target="_blank" rel="noreferrer">{ev.url}</a>
              }
              <p className="muted">{ev.filename||ev.url} · {ev.uploader_username||'Загружено'}</p>
            </div>)}
          </div>

          {canEdit&&<div className="form">
            <label>Добавить изображение или видео (до 200 МБ)
              <input type="file" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime" disabled={uploading===item.id} onChange={e=>{const file=e.target.files?.[0];void uploadEvidence(item,file);e.currentTarget.value='';}}/>
            </label>
            {uploading===item.id&&<p className="muted">Загружаем файл… Не закрывай страницу.</p>}
            <label>Или ссылка на доказательство
              <input type="url" placeholder="https://..." value={linkUrls[item.id]||''} onChange={e=>setLinkUrls(prev=>({...prev,[item.id]:e.target.value}))}/>
            </label>
            <button className="outline" onClick={()=>void addLink(item.id)}>Добавить ссылку</button>
          </div>}

          {editing===item.id ? <div className="form">
            <label>Причина
              <textarea value={reason} onChange={e=>setReason(e.target.value)} required minLength={3} maxLength={500}/>
            </label>
            <label>Срок окончания
              <input type="datetime-local" value={expires} onChange={e=>setExpires(e.target.value)}/>
            </label>
            <button className="primary" disabled={reason.trim().length<3} onClick={()=>save(item.id)}>Сохранить</button>
            <button className="outline" onClick={()=>setEditing(null)}>Отмена</button>
          </div> : canEdit&&<button className="outline" onClick={()=>{
            setEditing(item.id);
            setReason(item.reason||'');
            setExpires(item.expires_at?new Date(item.expires_at).toISOString().slice(0,16):'');
          }}>Редактировать</button>}
        </article>;
      })}
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
