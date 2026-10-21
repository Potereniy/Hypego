from pathlib import Path
import shutil
import sys

page = Path("app/page.tsx")
css = Path("app/style.css")
s = page.read_text()
styles = css.read_text()

allowed = "const allowed=['home','shop','rules','players','groups','trainee','profile','profile-settings','billing','friends','admin','auth'];"
help_link = "<button type=\"button\" onClick={()=>{setTab('trainee');setOpenNav('')}}>Стажировка</button>"
render_anchor = "{tab==='rules'&&<Rules/>}"
component_anchor = "function ServerStatus()"

checks = [
    (s.count(allowed), 1, "список вкладок"),
    (s.count(help_link), 1, "пункт Стажировка"),
    (s.count(render_anchor), 1, "рендер вкладки правил"),
    (s.count(component_anchor), 1, "место компонентов"),
]
for got, expected, label in checks:
    if got != expected:
        sys.exit(f"ОШИБКА: {label}: найдено {got}, ожидалось {expected}. Файлы не изменены.")

if "function SupportCenter(" in s:
    sys.exit("SupportCenter уже существует. Повторный патч отменён.")

shutil.copy2(page, Path("app/page.tsx.backup-support-ui"))
shutil.copy2(css, Path("app/style.css.backup-support-ui"))

s = s.replace(
    allowed,
    allowed.replace("'admin','auth'", "'admin','support','auth'"),
    1
)

s = s.replace(
    help_link,
    help_link + "{user&&<button type=\"button\" onClick={()=>{setTab('support');setOpenNav('')}}>Техподдержка</button>}",
    1
)

s = s.replace(
    render_anchor,
    render_anchor + "{tab==='support'&&user&&<SupportCenter user={user} onNotice={setNotice}/>}",
    1
)

component = r'''
function SupportCenter({user,onNotice}:{user:any,onNotice:(s:string)=>void}) {
 const [tickets,setTickets]=useState<any[]>([]);
 const [selectedId,setSelectedId]=useState('');
 const [messages,setMessages]=useState<any[]>([]);
 const [staff,setStaff]=useState(false);
 const [category,setCategory]=useState('other');
 const [subject,setSubject]=useState('');
 const [body,setBody]=useState('');
 const [draft,setDraft]=useState('');
 const [target,setTarget]=useState('');
 const [busy,setBusy]=useState(false);

 const categoryNames:Record<string,string>={
  account:'Аккаунт',payments:'Платежи',privileges:'Привилегии',
  server:'Проблема на сервере',player_complaint:'Жалоба на игрока',
  staff_complaint:'Жалоба на персонал',other:'Другое'
 };
 const statusNames:Record<string,string>={
  open:'Открыто',in_progress:'В работе',closed:'Закрыто'
 };
 const selected=tickets.find(t=>t.id===selectedId);

 async function loadTickets(){
  try{
   const r=await api('tickets');
   setTickets(r.tickets||[]);
   setStaff(Boolean(r.staff));
   setSelectedId(old=>old&&((r.tickets||[]).some((t:any)=>t.id===old))?old:'');
  }catch(e:any){onNotice(e.message||'Не удалось загрузить обращения');}
 }

 async function loadMessages(id:string){
  try{
   const r=await api('ticket-messages?ticket_id='+encodeURIComponent(id));
   setMessages(r.messages||[]);
  }catch(e:any){setMessages([]);onNotice(e.message||'Не удалось загрузить переписку');}
 }

 useEffect(()=>{
  if(user?.id)loadTickets();
 },[user?.id]);

 useEffect(()=>{
  if(selectedId)loadMessages(selectedId);
  else setMessages([]);
 },[selectedId]);

 async function createTicket(e:any){
  e.preventDefault();
  if(busy)return;
  setBusy(true);
  try{
   const r=await api('tickets',{
    method:'POST',
    body:JSON.stringify({subject,body,category})
   });
   setSubject('');
   setBody('');
   await loadTickets();
   setSelectedId(r.ticket.id);
   onNotice('Обращение создано');
  }catch(err:any){onNotice(err.message||'Не удалось создать обращение');}
  finally{setBusy(false);}
 }

 async function sendMessage(e:any){
  e.preventDefault();
  if(!selectedId||!draft.trim()||busy)return;
  setBusy(true);
  try{
   await api('ticket-messages',{
    method:'POST',
    body:JSON.stringify({ticket_id:selectedId,body:draft})
   });
   setDraft('');
   await loadMessages(selectedId);
   await loadTickets();
  }catch(err:any){onNotice(err.message||'Не удалось отправить сообщение');}
  finally{setBusy(false);}
 }

 async function ticketAction(action:string,assigned_to?:string){
  if(!selectedId||busy)return;
  setBusy(true);
  try{
   await api('tickets',{
    method:'PATCH',
    body:JSON.stringify({ticket_id:selectedId,action,assigned_to})
   });
   await loadTickets();
   await loadMessages(selectedId);
   onNotice('Обращение обновлено');
  }catch(err:any){onNotice(err.message||'Не удалось изменить обращение');}
  finally{setBusy(false);}
 }

 return <section className="section supportCenter">
  <div className="sectionHead">
   <div><span className="eyebrow">HYPEGO / SUPPORT</span><h2>Техподдержка</h2></div>
   <p>{staff?'Очередь обращений игроков':'Создай обращение и следи за ответами здесь'}</p>
  </div>
  <div className="supportLayout">
   <div className="panel supportSidebar">
    <h3>{staff?'Очередь обращений':'Мои обращения'}</h3>
    <button className="primary" type="button" onClick={()=>setSelectedId('')}>＋ Новое обращение</button>
    <div className="supportTicketList">
     {tickets.map((t:any)=><button type="button" key={t.id}
      className={'supportTicket '+(selectedId===t.id?'active':'')}
      onClick={()=>setSelectedId(t.id)}>
      <strong>{t.subject}</strong>
      <span>{categoryNames[t.category]||'Другое'} · {statusNames[t.status]||t.status}</span>
      {staff&&<small>Игрок: {t.username||'—'}</small>}
      {Number(t.unread_count)>0&&<small className="supportUnread">Непрочитано: {t.unread_count}</small>}
     </button>)}
     {!tickets.length&&<p className="muted">Обращений пока нет.</p>}
    </div>
   </div>

   <div className="panel supportConversation">
    {!selectedId?<>
     <h3>Новое обращение</h3>
     <p className="muted">Опиши проблему подробно. Не отправляй пароли и коды подтверждения.</p>
     <form className="form" onSubmit={createTicket}>
      <label>Категория
       <select value={category} onChange={e=>setCategory(e.target.value)}>
        {Object.entries(categoryNames).map(([k,v])=><option key={k} value={k}>{v}</option>)}
       </select>
      </label>
      <label>Тема
       <input required minLength={3} maxLength={120} value={subject} onChange={e=>setSubject(e.target.value)} placeholder="Кратко опиши вопрос"/>
      </label>
      <label>Сообщение
       <textarea required minLength={5} maxLength={4000} value={body} onChange={e=>setBody(e.target.value)} placeholder="Что произошло? Что ты уже пробовал?"/>
      </label>
      <button className="primary" disabled={busy} type="submit">{busy?'Отправка…':'Создать обращение'}</button>
     </form>
    </>:selected?<>
     <div className="supportConversationHead">
      <div><span className="eyebrow">{categoryNames[selected.category]||'Обращение'}</span><h3>{selected.subject}</h3>
       <span className="muted">Статус: {statusNames[selected.status]||selected.status}</span>
       {staff&&<p className="muted">Игрок: {selected.username||'—'} · Ответственный: {selected.assigned_to||'не назначен'}</p>}
      </div>
     </div>
     {staff&&<div className="supportActions">
      <button className="outline" type="button" disabled={busy} onClick={()=>ticketAction('assign')}>Взять в работу</button>
      {selected.status==='closed'
       ?<button className="outline" type="button" disabled={busy} onClick={()=>ticketAction('reopen')}>Открыть повторно</button>
       :<button className="outline" type="button" disabled={busy} onClick={()=>ticketAction('close')}>Закрыть</button>}
      <div className="supportTransfer">
       <input value={target} onChange={e=>setTarget(e.target.value)} placeholder="UUID сотрудника"/>
       <button className="outline" type="button" disabled={busy||!target.trim()} onClick={()=>ticketAction('transfer',target.trim())}>Передать</button>
      </div>
     </div>}
     <div className="supportMessages">
      {messages.map((m:any)=><div key={m.id} className={'supportMessage '+(m.sender_id===user.id?'mine':'')}>
       <div className="supportMessageMeta"><strong>{m.sender_username|| (m.sender_id===user.id?'Вы':'Участник')}</strong><time>{m.created_at?new Date(m.created_at).toLocaleString('ru-RU'):''}</time></div>
       <p>{m.body}</p>
      </div>)}
      {!messages.length&&<p className="muted">Сообщений пока нет.</p>}
     </div>
     {selected.status!=='closed'||staff?<form className="supportReply" onSubmit={sendMessage}>
      <textarea required maxLength={4000} value={draft} onChange={e=>setDraft(e.target.value)} placeholder="Напиши сообщение…"/>
      <button className="primary" disabled={busy||!draft.trim()} type="submit">Отправить</button>
     </form>:<p className="muted">Обращение закрыто. Если проблема осталась, создай новое.</p>}
    </>:<p className="muted">Выбери обращение из списка.</p>}
   </div>
  </div>
 </section>;
}

'''

s = s.replace(component_anchor, component + component_anchor, 1)

styles += r'''

/* Hypego support tickets */
.supportLayout{display:grid;grid-template-columns:minmax(250px,.75fr) minmax(0,1.5fr);gap:16px;align-items:start}
.supportSidebar,.supportConversation{min-width:0}
.supportSidebar>.primary{width:100%;margin:8px 0 14px}
.supportTicketList{display:grid;gap:8px;margin-top:12px}
.supportTicket{display:grid;gap:7px;text-align:left;width:100%;padding:13px;background:#090d16;border:1px solid var(--line);border-radius:10px;overflow-wrap:anywhere}
.supportTicket.active{border-color:var(--accent);background:#a78bfa12}
.supportTicket strong{font-size:12px}
.supportTicket span,.supportTicket small{font-size:10px;color:var(--muted)}
.supportTicket .supportUnread{color:var(--accent2)}
.supportConversation{display:flex;flex-direction:column;gap:14px}
.supportConversation h3{margin:5px 0 8px;overflow-wrap:anywhere}
.supportConversationHead{display:flex;justify-content:space-between;gap:12px}
.supportActions{display:flex;flex-wrap:wrap;gap:8px}
.supportTransfer{display:flex;flex:1;min-width:220px;gap:6px}
.supportTransfer input{width:100%;min-width:0;background:#090d16;border:1px solid var(--line);border-radius:8px;padding:9px;color:white;font-size:11px}
.supportMessages{display:flex;flex-direction:column;gap:10px;max-height:480px;overflow:auto;padding:4px 2px}
.supportMessage{align-self:flex-start;max-width:90%;padding:12px 14px;border:1px solid var(--line);background:#090d16;border-radius:12px;overflow-wrap:anywhere}
.supportMessage.mine{align-self:flex-end;background:#a78bfa12;border-color:#a78bfa55}
.supportMessageMeta{display:flex;flex-wrap:wrap;gap:10px;align-items:center}
.supportMessageMeta strong{font-size:11px}
.supportMessageMeta time{font-size:9px;color:var(--muted)}
.supportMessage p{white-space:pre-wrap;font-size:12px;line-height:1.7;margin:8px 0 0}
.supportReply{display:flex;align-items:stretch;gap:9px}
.supportReply textarea{flex:1;min-width:0;min-height:72px;resize:vertical;background:#090d16;border:1px solid var(--line);border-radius:10px;color:white;padding:12px;font-size:12px}
.supportReply .primary{align-self:flex-end}
@media(max-width:760px){.supportLayout{grid-template-columns:1fr}.supportMessages{max-height:400px}.supportReply{flex-direction:column}.supportReply .primary{align-self:stretch}.supportActions>*{max-width:100%}}
'''

page.write_text(s)
css.write_text(styles)
print("OK: интерфейс техподдержки добавлен.")
print("Резервные копии: app/page.tsx.backup-support-ui и app/style.css.backup-support-ui")
