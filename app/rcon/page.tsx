'use client';

import { useCallback, useEffect, useState } from 'react';

type RconState = {
  access?: { access_level: number } | null;
  canManageAccess?: boolean;
  accessList?: {
    user_id: string;
    username: string;
    access_level: number;
  }[];
  connection?: string;
  commandsEnabled?: boolean;
  error?: string;
  levels?: { level: number; title: string }[];
};

const panelStyle = {
  background: '#11131b',
  border: '1px solid #292d3c',
  borderRadius: 14,
  padding: 18,
} as const;

const inputStyle = {
  width: '100%',
  boxSizing: 'border-box' as const,
  padding: '11px 12px',
  color: '#f4f4fa',
  background: '#191c27',
  border: '1px solid #353a4c',
  borderRadius: 9,
  marginTop: 7,
};

const buttonStyle = {
  padding: '11px 15px',
  color: '#fff',
  background: '#7048e8',
  border: 0,
  borderRadius: 9,
  cursor: 'pointer',
  fontWeight: 600,
};

export default function RconPage() {
  const [data, setData] = useState<RconState | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [username, setUsername] = useState('');
  const [level, setLevel] = useState('1');
  const [action, setAction] = useState('say');
  const [target, setTarget] = useState('');
  const [message, setMessage] = useState('');
  const [reason, setReason] = useState('');
  const [command, setCommand] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/rcon', { cache: 'no-store' });
      const result = await response.json();
      setData(response.ok ? result : { error: result.error || 'Нет доступа' });
    } catch {
      setData({ error: 'Не удалось связаться с API' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function send(payload: Record<string, unknown>) {
    setBusy(true);
    setNotice('');
    try {
      const response = await fetch('/api/rcon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      setNotice(result.message || result.error || 'Готово');
      if (response.ok) {
        setUsername('');
        await refresh();
      }
    } catch {
      setNotice('Ошибка соединения с сайтом');
    } finally {
      setBusy(false);
    }
  }

  const currentLevel = Number(data?.access?.access_level ?? 0);
  const connectionText =
    data?.connection === 'connected' ? 'Подключён' :
    data?.connection === 'error' ? 'Ошибка подключения' :
    'Не настроен';

  return (
    <main style={{
      maxWidth: 1100, margin: '0 auto', padding: '28px 18px 60px',
      color: '#f4f4fa', minHeight: '70vh',
    }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ color: '#a78bfa', fontSize: 12, fontWeight: 700, letterSpacing: 2 }}>
          HYPEGO / CONTROL CENTER
        </div>
        <h1 style={{ fontSize: 32, margin: '8px 0' }}>RCON-панель</h1>
        <p style={{ color: '#a4a8bb', margin: 0 }}>
          Управление Minecraft-сервером и доступами персонала.
        </p>
      </div>

      {loading ? (
        <div style={panelStyle}>Загрузка панели…</div>
      ) : data?.error ? (
        <div style={panelStyle}>
          <h3 style={{ marginTop: 0 }}>Доступ ограничен</h3>
          <p style={{ color: '#ff9b9b' }}>{data.error}</p>
          <button style={buttonStyle} onClick={() => void refresh()}>Обновить</button>
        </div>
      ) : (
        <>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))',
            gap: 12, marginBottom: 18,
          }}>
            <section style={panelStyle}>
              <div style={{ color: '#a4a8bb', fontSize: 13 }}>Состояние сервера</div>
              <h2 style={{ marginBottom: 5, color: data?.connection === 'connected' ? '#69db7c' : '#ffd166' }}>
                {connectionText}
              </h2>
              <small style={{ color: '#a4a8bb' }}>Команды: {data?.commandsEnabled ? 'разрешены мостом' : 'заблокированы'}</small>
            </section>
            <section style={panelStyle}>
              <div style={{ color: '#a4a8bb', fontSize: 13 }}>Ваш уровень</div>
              <h2 style={{ marginBottom: 5 }}>{currentLevel ? `${currentLevel} / 5` : data?.canManageAccess ? 'Нет личного уровня' : 'Не назначен'}</h2>
              <small style={{ color: '#a4a8bb' }}>
                {data?.canManageAccess ? 'Можно управлять доступами' : 'Доступ выдан отдельно'}
              </small>
            </section>
          </div>

          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,340px),1fr))',
            gap: 16,
          }}>
            {currentLevel > 0 && (
            <section style={panelStyle}>
              <h2 style={{ marginTop: 0 }}>Команды</h2>
              <label>Действие
                <select value={action} onChange={e => setAction(e.target.value)} style={inputStyle}>
                  <option value="say">/say — сообщение в чат сервера</option>
                  <option value="ban">/ban — заблокировать игрока</option>
                  <option value="mute">/mute — запретить писать в чат</option>
                  <option value="kick">/kick — исключить игрока</option>
                  <option value="pardon">/pardon — снять бан</option>
                  <option value="unmute">/unmute — снять мут</option>
                  {currentLevel >= 2 && <option value="player_info">Информация об игроке — уровень 2</option>}
                  {currentLevel >= 3 && <option value="privilege_restriction">Временное ограничение — уровень 3</option>}
                  {currentLevel >= 3 && <option value="report">/report — уровень 3</option>}
                  {currentLevel >= 3 && <option value="unreport">/unreport — уровень 3</option>}
                  {currentLevel >= 4 && <option value="server_manage">Управление сервером — уровень 4</option>}
                  {currentLevel >= 5 && <option value="console_command">Полная консоль — уровень 5</option>}
                </select>
              </label>

              {action === 'say' ? (
                <label style={{ display: 'block', marginTop: 14 }}>Текст сообщения
                  <textarea value={message} onChange={e => setMessage(e.target.value)}
                    maxLength={300} rows={3} style={inputStyle}
                    placeholder="Сообщение для чата сервера" />
                </label>
              ) : action === 'console_command' ? (
                <label style={{ display: 'block', marginTop: 14 }}>Команда консоли
                  <textarea value={command} onChange={e => setCommand(e.target.value)}
                    maxLength={500} rows={3} style={inputStyle}
                    placeholder="Введите команду без начального /" />
                </label>
              ) : (
                <label style={{ display: 'block', marginTop: 14 }}>Ник игрока
                  <input value={target} onChange={e => setTarget(e.target.value)}
                    maxLength={32} style={inputStyle} placeholder="Minecraft-ник" />
                </label>
              )}

              {['ban', 'mute', 'kick', 'privilege_restriction', 'report'].includes(action) && (
                <label style={{ display: 'block', marginTop: 14 }}>Причина
                  <input value={reason} onChange={e => setReason(e.target.value)}
                    maxLength={300} style={inputStyle} placeholder="Причина наказания" />
                </label>
              )}

              <button disabled={busy} style={{ ...buttonStyle, marginTop: 16, opacity: busy ? 0.6 : 1 }}
                onClick={() => {
                  if (action === 'say' && !message.trim()) {
                    setNotice('Введи сообщение');
                    return;
                  }
                  if (action === 'console_command' && !command.trim()) {
                    setNotice('Введи команду консоли');
                    return;
                  }
                  if (!['say', 'console_command'].includes(action) && !target.trim()) {
                    setNotice('Введи ник игрока');
                    return;
                  }
                  if (['report', 'privilege_restriction'].includes(action) && !reason.trim()) {
                    setNotice('Укажи причину временного ограничения');
                    return;
                  }
                  if (!window.confirm('Отправить запрос? Если сервер не подключён, команда не выполнится.')) return;
                  void send({
                    action,
                    message: message.trim(),
                    command: command.trim(),
                    username: target.trim(),
                    reason: reason.trim(),
                  });
                }}>
                {busy ? 'Отправка…' : 'Отправить запрос'}
              </button>
              <p style={{ color: '#a4a8bb', fontSize: 12, lineHeight: 1.5 }}>
                До настройки доверенного моста команды не исполняются.
              </p>
            </section>
            )}

            {data?.canManageAccess && (
              <section style={panelStyle}>
                <h2 style={{ marginTop: 0 }}>Управление доступом</h2>
                <label>Ник пользователя сайта
                  <input value={username} onChange={e => setUsername(e.target.value)}
                    style={inputStyle} placeholder="Точный ник аккаунта Hypego" />
                </label>
                <label style={{ display: 'block', marginTop: 14 }}>Уровень доступа
                  <select value={level} onChange={e => setLevel(e.target.value)} style={inputStyle}>
                    <option value="1">1 — /say, /ban, /mute, /kick, /pardon, /unmute</option>
                    <option value="2">2 — Уровень 1 + информация об игроках</option>
                    <option value="3">3 — Уровни 1–2 + временные ограничения</option>
                    <option value="4">4 — Уровни 1–3 + управление сервером</option>
                    <option value="5">5 — Полный доступ ко всем командам сервера</option>
                  </select>
                </label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 16 }}>
                  <button disabled={busy || !username.trim()} style={buttonStyle}
                    onClick={() => void send({ action: 'grant', username: username.trim(), level: Number(level) })}>
                    Выдать / изменить
                  </button>
                  <button disabled={busy || !username.trim()}
                    style={{ ...buttonStyle, background: '#8b303c' }}
                    onClick={() => {
                      if (window.confirm(`Отозвать RCON-доступ у ${username}?`)) {
                        void send({ action: 'revoke', username: username.trim() });
                      }
                    }}>
                    Отозвать
                  </button>
                </div>

                <h3 style={{ marginTop: 26 }}>Выданные доступы</h3>
                {data.accessList?.length ? data.accessList.map(item => (
                  <div key={item.user_id} style={{
                    display: 'flex', justifyContent: 'space-between', gap: 10,
                    padding: '10px 0', borderBottom: '1px solid #292d3c',
                  }}>
                    <span>{item.username}</span>
                    <span style={{ color: '#c0aaff' }}>Уровень {item.access_level}</span>
                  </div>
                )) : <p style={{ color: '#a4a8bb' }}>Доступы пока не выданы.</p>}
              </section>
            )}
          </div>

          {notice && (
            <div role="status" style={{ ...panelStyle, marginTop: 16, borderColor: '#7048e8' }}>
              {notice}
            </div>
          )}

          <section style={{ ...panelStyle, marginTop: 16 }}>
            <h2 style={{ marginTop: 0 }}>Уровни доступа</h2>
            {(data?.levels ?? []).map(item => (
              <div key={item.level} style={{
                display: 'flex', gap: 12, padding: '10px 0',
                borderBottom: '1px solid #292d3c',
              }}>
                <strong style={{ color: '#c0aaff', minWidth: 75 }}>Уровень {item.level}</strong>
                <span>{item.title}</span>
              </div>
            ))}
          </section>
        </>
      )}
    </main>
  );
}
