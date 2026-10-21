from pathlib import Path
import sys

p = Path("app/api/[...path]/route.ts")
s = p.read_text()
start = "if(key==='tickets'&&method==='POST'){"
end = "if(key==='admin/privileges'&&method==='POST'){"

if s.count(start) != 1 or s.count(end) != 1:
    sys.exit("ОШИБКА: структура API не совпала. Файл не изменён.")

a = s.index(start)
b = s.index(end, a)
if b <= a:
    sys.exit("ОШИБКА: порядок обработчиков неверный.")

replacement = r"""
if(key==='tickets'&&method==='POST'){
 const u=await requireUser(),b=await bodyJson(req);
 const subject=String(b.subject||'').trim().slice(0,120);
 const body=String(b.body||'').trim().slice(0,4000);
 const category=String(b.category||'other');
 const categories=['account','payments','privileges','server','player_complaint','staff_complaint','other'];
 if(subject.length<3||body.length<5)throw new HttpError(400,'Заполни тему и сообщение');
 if(!categories.includes(category))throw new HttpError(400,'Неизвестная категория');
 const rows=await db`INSERT INTO tickets(user_id,subject,body,category) VALUES(${u.id},${subject},${body},${category}) RETURNING *`;
 await db`INSERT INTO ticket_messages(ticket_id,sender_id,body) VALUES(${rows[0].id},${u.id},${body})`;
 await audit(u.id,'ticket.create','ticket',rows[0].id,{category,subject});
 return Response.json({ticket:rows[0]},{status:201});
}

if(key==='tickets'&&method==='GET'){
 const u=await requireUser();
 const rr=await db`SELECT EXISTS(SELECT 1 FROM user_roles ur JOIN roles r ON r.id=ur.role_id WHERE ur.user_id=${u.id} AND r.id IN ('owner','deputy','management','curator','tech_admin','support')) AS staff`;
 const staff=Boolean(rr[0]?.staff);
 const rows=staff
 ?await db`SELECT t.*,u.username,(SELECT COUNT(*)::int FROM ticket_messages m WHERE m.ticket_id=t.id AND m.read_at IS NULL AND m.sender_id<>${u.id}) AS unread_count FROM tickets t JOIN users u ON u.id=t.user_id ORDER BY CASE WHEN t.status='closed' THEN 1 ELSE 0 END,t.updated_at DESC LIMIT 200`
 :await db`SELECT t.*,(SELECT COUNT(*)::int FROM ticket_messages m WHERE m.ticket_id=t.id AND m.read_at IS NULL AND m.sender_id<>${u.id}) AS unread_count FROM tickets t WHERE t.user_id=${u.id} ORDER BY t.created_at DESC LIMIT 100`;
 return Response.json({tickets:rows,staff});
}

if(key==='ticket-messages'&&(method==='GET'||method==='POST')){
 const u=await requireUser();
 const rr=await db`SELECT EXISTS(SELECT 1 FROM user_roles ur JOIN roles r ON r.id=ur.role_id WHERE ur.user_id=${u.id} AND r.id IN ('owner','deputy','management','curator','tech_admin','support')) AS staff`;
 const staff=Boolean(rr[0]?.staff);
 const b=method==='POST'?await bodyJson(req):{};
 const ticketId=String(method==='GET'?new URL(req.url).searchParams.get('ticket_id')||'':b.ticket_id||'');
 if(!/^[0-9a-f-]{36}$/i.test(ticketId))throw new HttpError(400,'Некорректный номер обращения');
 if(method==='GET'){
  const tickets=staff?await db`SELECT t.*,u.username FROM tickets t JOIN users u ON u.id=t.user_id WHERE t.id=${ticketId} LIMIT 1`:await db`SELECT * FROM tickets WHERE id=${ticketId} AND user_id=${u.id} LIMIT 1`;
  if(!tickets.length)throw new HttpError(404,'Обращение не найдено');
  await db`UPDATE ticket_messages SET read_at=NOW() WHERE ticket_id=${ticketId} AND sender_id<>${u.id} AND read_at IS NULL`;
  const messages=await db`SELECT m.*,u.username AS sender_username FROM ticket_messages m JOIN users u ON u.id=m.sender_id WHERE m.ticket_id=${ticketId} ORDER BY m.created_at ASC LIMIT 1000`;
  return Response.json({ticket:tickets[0],messages,staff});
 }
 const body=String(b.body||'').trim().slice(0,4000);
 if(!body)throw new HttpError(400,'Напиши сообщение');
 const tickets=staff?await db`SELECT * FROM tickets WHERE id=${ticketId} LIMIT 1`:await db`SELECT * FROM tickets WHERE id=${ticketId} AND user_id=${u.id} LIMIT 1`;
 if(!tickets.length)throw new HttpError(404,'Обращение не найдено');
 if(tickets[0].status==='closed'&&!staff)throw new HttpError(400,'Обращение закрыто');
 const rows=await db`INSERT INTO ticket_messages(ticket_id,sender_id,body) VALUES(${ticketId},${u.id},${body}) RETURNING *`;
 await db`UPDATE tickets SET status=CASE WHEN status='closed' AND ${staff} THEN status WHEN status='closed' THEN 'open' ELSE status END,closed_at=CASE WHEN status='closed' AND ${staff} THEN closed_at ELSE NULL END,updated_at=NOW() WHERE id=${ticketId}`;
 await audit(u.id,'ticket.message','ticket',ticketId,{message_id:rows[0].id});
 return Response.json({message:rows[0]},{status:201});
}

if(key==='tickets'&&method==='PATCH'){
 const u=await requireUser(),b=await bodyJson(req);
 const ticketId=String(b.ticket_id||''),action=String(b.action||'');
 if(!/^[0-9a-f-]{36}$/i.test(ticketId))throw new HttpError(400,'Некорректный номер обращения');
 const rr=await db`SELECT EXISTS(SELECT 1 FROM user_roles ur JOIN roles r ON r.id=ur.role_id WHERE ur.user_id=${u.id} AND r.id IN ('owner','deputy','management','curator','tech_admin','support')) AS staff`;
 if(!rr[0]?.staff)throw new HttpError(403,'Нет доступа к управлению обращениями');
 let rows;
 if(action==='assign'){
  rows=await db`UPDATE tickets SET assigned_to=${u.id},status='in_progress',closed_at=NULL,updated_at=NOW() WHERE id=${ticketId} RETURNING *`;
 }else if(action==='transfer'){
  const target=String(b.assigned_to||'');
  if(!/^[0-9a-f-]{36}$/i.test(target))throw new HttpError(400,'Укажи ID сотрудника');
  const ok=await db`SELECT EXISTS(SELECT 1 FROM user_roles ur JOIN roles r ON r.id=ur.role_id WHERE ur.user_id=${target} AND r.id IN ('owner','deputy','management','curator','tech_admin','support')) AS allowed`;
  if(!ok[0]?.allowed)throw new HttpError(400,'Получатель не является сотрудником техподдержки');
  rows=await db`UPDATE tickets SET assigned_to=${target},status='in_progress',closed_at=NULL,updated_at=NOW() WHERE id=${ticketId} RETURNING *`;
 }else if(action==='close'){
  rows=await db`UPDATE tickets SET status='closed',closed_at=NOW(),updated_at=NOW() WHERE id=${ticketId} RETURNING *`;
 }else if(action==='reopen'){
  rows=await db`UPDATE tickets SET status='open',closed_at=NULL,updated_at=NOW() WHERE id=${ticketId} RETURNING *`;
 }else throw new HttpError(400,'Неизвестное действие');
 if(!rows.length)throw new HttpError(404,'Обращение не найдено');
 await audit(u.id,'ticket.'+action,'ticket',ticketId,{assigned_to:rows[0].assigned_to||null});
 return Response.json({ticket:rows[0]});
}

"""

p.write_text(s[:a] + replacement + s[b:])
print("OK: обработчики тикетов заменены.")
