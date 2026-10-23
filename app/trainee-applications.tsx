'use client';

import { useEffect, useState } from 'react';

type Props = {
  user: { id: string; username: string } | null;
  roles: any[];
  onNotice: (message: string) => void;
};

async function request(url: string, init?: RequestInit) {
  const r = await fetch('/api/' + url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || 'Ошибка запроса');
  return j;
}

const statusText: Record<string, string> = {
  pending: 'На рассмотрении',
  approved: 'Принят',
  rejected: 'Отклонён',
};

export default function TraineeApplications({ user, roles, onNotice }: Props) {
  const curator = roles.some(r => r.id === 'curator');
  const [publicList, setPublicList] = useState<any[]>([]);
  const [mine, setMine] = useState<any[]>([]);
  const [privateList, setPrivateList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [minecraft, setMinecraft] = useState('');
  const [age, setAge] = useState('18');
  const [experience, setExperience] = useState('');
  const [hours, setHours] = useState('3');
  const [days, setDays] = useState('5');
  const [motivation, setMotivation] = useState('');
  const [additional, setAdditional] = useState('');
  const [comments, setComments] = useState<Record<string, string>>({});
  const [publicFilter, setPublicFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [selectedApplication, setSelectedApplication] = useState<any | null>(null);

  async function refresh() {
    setLoading(true);
    try {
      const p = await request('trainee-applications');
      setPublicList(p.applications || []);
      if (user) {
        const m = await request('trainee-applications/mine');
        setMine(m.applications || []);
      } else {
        setMine([]);
      }
      if (user && curator) {
        const a = await request('admin/trainee-applications');
        setPrivateList(a.applications || []);
      } else {
        setPrivateList([]);
      }
    } catch (e: any) {
      onNotice(e.message || 'Не удалось загрузить заявки');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, [user?.id, curator]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await request('trainee-applications', {
        method: 'POST',
        body: JSON.stringify({
          minecraft_username: minecraft,
          age: Number(age),
          experience,
          hours_per_day: Number(hours),
          days_per_week: Number(days),
          motivation,
          additional_info: additional,
        }),
      });
      onNotice('Заявка отправлена на рассмотрение.');
      setMinecraft('');
      setExperience('');
      setMotivation('');
      setAdditional('');
      await refresh();
    } catch (e: any) {
      onNotice(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function decide(id: string, status: 'approved' | 'rejected') {
    setBusy(true);
    try {
      await request('admin/trainee-applications', {
        method: 'PATCH',
        body: JSON.stringify({
          id,
          status,
          curator_comment: comments[id] || '',
        }),
      });
      onNotice(status === 'approved' ? 'Заявка одобрена.' : 'Заявка отклонена.');
      await refresh();
    } catch (e: any) {
      onNotice(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="section">
      <div className="eyebrow">HYPEGO NETWORK</div>
      <h2>Стажировка <em>в команде</em></h2>
      <p className="muted">
        Подай заявку на вступление в команду проекта. Решение принимает куратор.
      </p>

      <div className="panel traineePublicPanel">
        <div className="traineePublicHeader">
          <div>
            <h3>Заявки на стажировку</h3>
            <p className="muted">Здесь можно посмотреть заявки других игроков и взять их за пример.</p>
          </div>
        </div>

        <div className="traineeApplicationFilters">
          {([
            ['all', 'Все'],
            ['pending', 'На рассмотрении'],
            ['approved', 'Принятые'],
            ['rejected', 'Отклонённые'],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={publicFilter === value ? 'active' : ''}
              onClick={() => setPublicFilter(value)}
            >
              {label}
            </button>
          ))}
        </div>

        {loading ? <p>Загрузка…</p> : (() => {
          const filtered = publicList.filter(a =>
            publicFilter === 'all' ? true : a.status === publicFilter
          );

          if (filtered.length === 0) {
            return <p className="muted">В этом разделе заявок пока нет.</p>;
          }

          return (
            <div className="traineeApplicationList">
              {filtered.map(a => (
                <button
                  type="button"
                  className="traineeApplicationRow"
                  key={a.id}
                  onClick={() => setSelectedApplication(a)}
                >
                  <div className="traineeApplicationAvatar">
                    {a.avatar_url ? (
                      <img src={a.avatar_url} alt="" />
                    ) : (
                      <span>{(a.display_name || a.account_username || a.minecraft_username || '?').charAt(0).toUpperCase()}</span>
                    )}
                  </div>

                  <div className="traineeApplicationIdentity">
                    <strong style={{ color: a.nickname_color || undefined }}>
                      {a.display_name || a.account_username || a.minecraft_username}
                    </strong>
                    <span>@{a.account_username || a.minecraft_username}</span>
                    <small>Заявка на стажировку</small>
                  </div>

                  <div className={'traineeApplicationStatus status-' + a.status}>
                    {statusText[a.status] || a.status}
                  </div>

                  <div className="traineeApplicationArrow">›</div>
                </button>
              ))}
            </div>
          );
        })()}
      </div>

      {selectedApplication && (
        <div
          className="traineeApplicationOverlay"
          role="presentation"
          onClick={() => setSelectedApplication(null)}
        >
          <div
            className="panel traineeApplicationModal"
            role="dialog"
            aria-modal="true"
            onClick={e => e.stopPropagation()}
          >
            <div className="traineeApplicationModalHeader">
              <div className="traineeApplicationProfile">
                <div className="traineeApplicationAvatar large">
                  {selectedApplication.avatar_url ? (
                    <img src={selectedApplication.avatar_url} alt="" />
                  ) : (
                    <span>{(selectedApplication.display_name || selectedApplication.account_username || selectedApplication.minecraft_username || '?').charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div>
                  <h3 style={{ color: selectedApplication.nickname_color || undefined }}>
                    {selectedApplication.display_name || selectedApplication.account_username || selectedApplication.minecraft_username}
                  </h3>
                  <span>@{selectedApplication.account_username || selectedApplication.minecraft_username}</span>
                  <small>Заявка на стажировку</small>
                </div>
              </div>

              <button
                type="button"
                className="outline traineeApplicationClose"
                onClick={() => setSelectedApplication(null)}
              >
                Закрыть
              </button>
            </div>

            <div className="traineeApplicationModalStatus">
              <span className={'traineeApplicationStatus status-' + selectedApplication.status}>
                {statusText[selectedApplication.status] || selectedApplication.status}
              </span>
              <span className="muted">
                Подана {new Date(selectedApplication.created_at).toLocaleDateString('ru-RU')}
              </span>
            </div>

            <div className="traineeApplicationDetails">
              <div>
                <span>Ник Minecraft</span>
                <strong>{selectedApplication.minecraft_username}</strong>
              </div>
              <div>
                <span>Опыт</span>
                <p>{selectedApplication.experience}</p>
              </div>
              <div>
                <span>Почему хочет попасть в команду</span>
                <p>{selectedApplication.motivation}</p>
              </div>
              {selectedApplication.additional_info && (
                <div>
                  <span>Дополнительная информация</span>
                  <p>{selectedApplication.additional_info}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {!user && <p className="notice">Войди в аккаунт, чтобы подать заявку.</p>}

      {user && (
        <div className="panel">
          <h3>Мои заявки</h3>
          {mine.length === 0 ? (
            <p className="muted">У тебя пока нет заявок.</p>
          ) : mine.map(a => (
            <article className="product" key={a.id}>
              <strong>{a.minecraft_username}</strong>
              <p>Статус: {statusText[a.status] || a.status}</p>
              <p>Возраст: {a.age} · Онлайн: {a.hours_per_day} ч./день, {a.days_per_week} дн./нед.</p>
              <p><b>Опыт:</b> {a.experience}</p>
              <p><b>Мотивация:</b> {a.motivation}</p>
              {a.additional_info && <p><b>Дополнительно:</b> {a.additional_info}</p>}
              {a.curator_comment && <p><b>Ответ куратора:</b> {a.curator_comment}</p>}
            </article>
          ))}
          {!mine.some(a => a.status === 'pending') && (
            <>
              <h3>Подать заявку</h3>
              <form className="form" onSubmit={submit}>
                <label>Ник Minecraft
                  <input value={minecraft} onChange={e => setMinecraft(e.target.value)} required minLength={3} maxLength={24} pattern="[A-Za-z0-9_]+" />
                </label>
                <label>Возраст
                  <input type="number" value={age} onChange={e => setAge(e.target.value)} min="13" max="100" required />
                </label>
                <label>Опыт на сервере и в команде
                  <textarea value={experience} onChange={e => setExperience(e.target.value)} minLength={10} maxLength={2000} required />
                </label>
                <label>Сколько часов в день готов уделять?
                  <input type="number" value={hours} onChange={e => setHours(e.target.value)} min="0.5" max="24" step="0.5" required />
                </label>
                <label>Сколько дней в неделю?
                  <input type="number" value={days} onChange={e => setDays(e.target.value)} min="1" max="7" required />
                </label>
                <label>Почему хочешь попасть в команду?
                  <textarea value={motivation} onChange={e => setMotivation(e.target.value)} minLength={10} maxLength={2000} required />
                </label>
                <label>Дополнительная информация (необязательно)
                  <textarea value={additional} onChange={e => setAdditional(e.target.value)} maxLength={2000} />
                </label>
                <button className="primary" disabled={busy}>{busy ? 'Отправка…' : 'Отправить заявку'}</button>
              </form>
            </>
          )}
        </div>
      )}

      {user && curator && (
        <div className="panel">
          <h3>Панель куратора</h3>
          {privateList.filter(a => a.status === 'pending').length === 0
            ? <p className="muted">Новых заявок на рассмотрении нет.</p>
            : privateList.filter(a => a.status === 'pending').map(a => (
              <article className="product" key={a.id}>
                <h3>{a.minecraft_username}</h3>
                <p>Аккаунт Hypego: @{a.account_username}</p>
                <p>Возраст: {a.age}</p>
                <p>Онлайн: {a.hours_per_day} ч./день, {a.days_per_week} дн./нед.</p>
                <p><b>Опыт:</b> {a.experience}</p>
                <p><b>Мотивация:</b> {a.motivation}</p>
                {a.additional_info && <p><b>Дополнительно:</b> {a.additional_info}</p>}
                <label>Комментарий к решению
                  <textarea value={comments[a.id] || ''} onChange={e => setComments(v => ({ ...v, [a.id]: e.target.value }))} maxLength={1000} />
                </label>
                <div className="heroActions">
                  <button className="primary" disabled={busy} onClick={() => decide(a.id, 'approved')}>Принять</button>
                  <button className="outline" disabled={busy} onClick={() => decide(a.id, 'rejected')}>Отклонить</button>
                </div>
              </article>
            ))}
        </div>
      )}
    </section>
  );
}
