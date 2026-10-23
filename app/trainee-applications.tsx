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

  const [publicFilter, setPublicFilter] =
    useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  const [selectedApplication, setSelectedApplication] = useState<any | null>(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  const [messages, setMessages] = useState<any[]>([]);
  const [chatText, setChatText] = useState('');
  const [chatOpen, setChatOpen] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);

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

  const selectedDetails = selectedApplication
    ? privateList.find(a => a.id === selectedApplication.id)
      || mine.find(a => a.id === selectedApplication.id)
      || selectedApplication
    : null;
  const canAccessSelectedChat = Boolean(
    user && selectedApplication &&
    (curator || mine.some(a => a.id === selectedApplication.id))
  );

  useEffect(() => {
    let cancelled = false;

    async function loadChat() {
      if (!selectedApplication || !user || !canAccessSelectedChat) {
        setMessages([]);
        setChatOpen(false);
        setChatText('');
        return;
      }

      setChatLoading(true);
      try {
        const result = await request(
          'trainee-applications/messages?id='
          + encodeURIComponent(selectedApplication.id)
        );
        if (!cancelled) {
          setMessages(result.messages || []);
          setChatOpen(Boolean(result.chatOpen));
        }
      } catch (e: any) {
        if (!cancelled) {
          setMessages([]);
          setChatOpen(false);
          onNotice(e.message || 'Не удалось загрузить переписку');
        }
      } finally {
        if (!cancelled) setChatLoading(false);
      }
    }

    loadChat();
    return () => {
      cancelled = true;
    };
  }, [selectedApplication?.id, user?.id, canAccessSelectedChat]);

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
      setAge('18');
      setExperience('');
      setHours('3');
      setDays('5');
      setMotivation('');
      setAdditional('');
      setShowSubmitModal(false);
      await refresh();
    } catch (e: any) {
      onNotice(e.message || 'Не удалось отправить заявку');
    } finally {
      setBusy(false);
    }
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();

    const text = chatText.trim();
    if (!selectedDetails || !text || busy || !chatOpen) return;

    setBusy(true);
    try {
      await request('trainee-applications/messages', {
        method: 'POST',
        body: JSON.stringify({
          id: selectedDetails.id,
          message: text,
        }),
      });

      setChatText('');
      const result = await request(
        'trainee-applications/messages?id='
        + encodeURIComponent(selectedDetails.id)
      );
      setMessages(result.messages || []);
      setChatOpen(Boolean(result.chatOpen));
    } catch (e: any) {
      onNotice(e.message || 'Не удалось отправить сообщение');
      if (e.message?.includes('Чат закрыт')) {
        setChatOpen(false);
      }
    } finally {
      setBusy(false);
    }
  }

  async function decide(id: string, status: 'approved' | 'rejected') {
    if (busy) return;

    const confirmed = window.confirm(
      status === 'approved'
        ? 'Принять эту заявку? После решения чат закроется.'
        : 'Отклонить эту заявку? После решения чат закроется.'
    );
    if (!confirmed) return;

    setBusy(true);
    try {
      await request('admin/trainee-applications', {
        method: 'PATCH',
        body: JSON.stringify({ id, status }),
      });

      setChatOpen(false);
      onNotice(
        status === 'approved'
          ? 'Заявка одобрена. Чат закрыт.'
          : 'Заявка отклонена. Чат закрыт.'
      );

      await refresh();

      const updated = {
        ...selectedApplication,
        status,
      };
      setSelectedApplication(updated);
    } catch (e: any) {
      onNotice(e.message || 'Не удалось изменить статус заявки');
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

      {user && !mine.some(a => a.status === 'pending') && (
        <div className="traineeSubmitBar">
          <button
            type="button"
            className="primary"
            onClick={() => setShowSubmitModal(true)}
          >
            ＋ Подать заявку
          </button>
        </div>
      )}

      {!user && (
        <p className="notice">Войди в аккаунт, чтобы подать заявку и общаться с куратором.</p>
      )}

      {user && (
        <div className="panel traineePublicPanel">
          <div className="traineePublicHeader">
            <div>
              <h3>Мои заявки</h3>
              <p className="muted">Открой заявку, чтобы посмотреть переписку и решение.</p>
            </div>
          </div>

          {mine.length === 0 ? (
            <p className="muted">У тебя пока нет заявок.</p>
          ) : (
            <div className="traineeApplicationList">
              {mine.map(a => (
                <button
                  type="button"
                  className="traineeApplicationRow"
                  key={a.id}
                  onClick={() => setSelectedApplication(a)}
                >
                  <div className="traineeApplicationAvatar">
                    <span>{(a.minecraft_username || '?').charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="traineeApplicationIdentity">
                    <strong>{a.minecraft_username}</strong>
                    <small>Твоя заявка · открыть переписку</small>
                  </div>
                  <div className={'traineeApplicationStatus status-' + a.status}>
                    {statusText[a.status] || a.status}
                  </div>
                  <div className="traineeApplicationArrow">›</div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {user && curator && (
        <div className="panel traineePublicPanel">
          <div className="traineePublicHeader">
            <div>
              <h3>Заявки игроков</h3>
              <p className="muted">Открой заявку, чтобы прочитать сообщения и принять решение.</p>
            </div>
          </div>

          {privateList.length === 0 ? (
            <p className="muted">Заявок пока нет.</p>
          ) : (
            <div className="traineeApplicationList">
              {privateList.map(a => (
                <button
                  type="button"
                  className="traineeApplicationRow"
                  key={a.id}
                  onClick={() => setSelectedApplication(a)}
                >
                  <div className="traineeApplicationAvatar">
                    <span>{(a.display_name || a.account_username || a.minecraft_username || '?').charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="traineeApplicationIdentity">
                    <strong>{a.display_name || a.account_username || a.minecraft_username}</strong>
                    <span>@{a.account_username || 'игрок'}</span>
                    <small>{a.minecraft_username}</small>
                  </div>
                  <div className={'traineeApplicationStatus status-' + a.status}>
                    {statusText[a.status] || a.status}
                  </div>
                  <div className="traineeApplicationArrow">›</div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="panel traineePublicPanel">
        <div className="traineePublicHeader">
          <div>
            <h3>Заявки на стажировку</h3>
            <p className="muted">
              Публичные примеры заявок других игроков.
            </p>
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

        {loading ? (
          <p>Загрузка…</p>
        ) : (() => {
          const filtered = publicList.filter(a =>
            publicFilter === 'all' || a.status === publicFilter
          );

          if (!filtered.length) {
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
                    {a.avatar_url
                      ? <img src={a.avatar_url} alt="" />
                      : <span>{(a.display_name || a.account_username || a.minecraft_username || '?').charAt(0).toUpperCase()}</span>}
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

      {showSubmitModal && (
        <div
          className="traineeApplicationOverlay"
          onClick={() => !busy && setShowSubmitModal(false)}
        >
          <div
            className="panel traineeApplicationModal"
            role="dialog"
            aria-modal="true"
            onClick={e => e.stopPropagation()}
          >
            <div className="traineeApplicationModalHeader">
              <div>
                <h3>Заявка на стажировку</h3>
                <p className="muted">Заполни анкету для команды Hypego.</p>
              </div>
              <button
                type="button"
                className="outline traineeApplicationClose"
                disabled={busy}
                onClick={() => setShowSubmitModal(false)}
              >
                Закрыть
              </button>
            </div>

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
              <button className="primary" disabled={busy}>
                {busy ? 'Отправка…' : 'Отправить заявку'}
              </button>
            </form>
          </div>
        </div>
      )}

      {selectedApplication && selectedDetails && (
        <div
          className="traineeApplicationOverlay"
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
                  {selectedDetails.avatar_url
                    ? <img src={selectedDetails.avatar_url} alt="" />
                    : <span>{(selectedDetails.display_name || selectedDetails.account_username || selectedDetails.minecraft_username || '?').charAt(0).toUpperCase()}</span>}
                </div>
                <div>
                  <h3 style={{ color: selectedDetails.nickname_color || undefined }}>
                    {selectedDetails.display_name || selectedDetails.account_username || selectedDetails.minecraft_username}
                  </h3>
                  <span>@{selectedDetails.account_username || user?.username || selectedDetails.minecraft_username}</span>
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
              <span className={'traineeApplicationStatus status-' + selectedDetails.status}>
                {statusText[selectedDetails.status] || selectedDetails.status}
              </span>
              <span className="muted">
                Подана {new Date(selectedDetails.created_at).toLocaleDateString('ru-RU')}
              </span>
            </div>

            <div className="traineeApplicationDetails">
              <div>
                <span>Ник Minecraft</span>
                <strong>{selectedDetails.minecraft_username}</strong>
              </div>

              {selectedDetails.age != null && (
                <div>
                  <span>Возраст и активность</span>
                  <p>{selectedDetails.age} лет · {selectedDetails.hours_per_day} ч./день · {selectedDetails.days_per_week} дн./нед.</p>
                </div>
              )}

              <div>
                <span>Опыт</span>
                <p>{selectedDetails.experience || 'Нет данных'}</p>
              </div>
              <div>
                <span>Почему хочет попасть в команду</span>
                <p>{selectedDetails.motivation || 'Нет данных'}</p>
              </div>
              {selectedDetails.additional_info && (
                <div>
                  <span>Дополнительная информация</span>
                  <p>{selectedDetails.additional_info}</p>
                </div>
              )}
              {selectedDetails.curator_comment && (
                <div>
                  <span>Комментарий к решению</span>
                  <p>{selectedDetails.curator_comment}</p>
                </div>
              )}
            </div>

            {user && canAccessSelectedChat && (
              <div className="traineeChat">
                <h3>Переписка с куратором</h3>

                {chatLoading ? (
                  <p className="muted">Загрузка сообщений…</p>
                ) : messages.length === 0 ? (
                  <p className="muted">Сообщений пока нет.</p>
                ) : (
                  <div className="traineeChatMessages">
                    {messages.map(m => (
                      <article
                        key={m.id}
                        className={'traineeChatMessage' + (m.user_id === user.id ? ' mine' : '')}
                      >
                        <div className="traineeChatMessageHeader">
                          <strong>
                            {m.user_id === user.id
                              ? 'Вы'
                              : m.display_name || m.username || 'Куратор'}
                          </strong>
                          <time>{new Date(m.created_at).toLocaleString('ru-RU')}</time>
                        </div>
                        <p>{m.message}</p>
                      </article>
                    ))}
                  </div>
                )}

                {chatOpen && selectedDetails.status === 'pending' ? (
                  <form
className="traineeChatForm" onSubmit={sendMessage}>
                    <textarea
                      value={chatText}
                      onChange={e => setChatText(e.target.value)}
                      placeholder="Напиши сообщение куратору…"
                      maxLength={2000}
                      required
                    />
                    <button className="primary" disabled={busy || !chatText.trim()}>
                      {busy ? 'Отправка…' : 'Отправить'}
                    </button>
                  </form>
                ) : (
                  <p className="notice">
                    Чат закрыт. История переписки доступна только для чтения.
                  </p>
                )}
              </div>
            )}

            {user && curator && selectedDetails.status === 'pending' && (
              <div className="heroActions traineeDecisionActions">
                <button
                  type="button"
                  className="primary"
                  disabled={busy}
                  onClick={() => decide(selectedDetails.id, 'approved')}
                >
                  Принять
                </button>
                <button
                  type="button"
                  className="outline"
                  disabled={busy}
                  onClick={() => decide(selectedDetails.id, 'rejected')}
                >
                  Отклонить
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
