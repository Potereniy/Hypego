'use client';

import { useCallback, useEffect, useState } from 'react';

type LogEntry = {
  id: string;
  action: string;
  target_username: string | null;
  access_level: number;
  details: Record<string, unknown>;
  result: string;
  created_at: string;
};

type RconData = {
  access: { access_level: number } | null;
  canManageAccess: boolean;
  connection: string;
  commandsEnabled: boolean;
  history?: LogEntry[];
};

const ACTIONS = [
  { value: 'say', label: '/say — сообщение в чат', level: 1 },
  { value: 'ban', label: '/ban — заблокировать игрока', level: 1 },
  { value: 'mute', label: '/mute — запретить писать', level: 1 },
  { value: 'kick', label: '/kick — исключить игрока', level: 1 },
  { value: 'pardon', label: '/pardon — снять бан', level: 1 },
  { value: 'unmute', label: '/unmute — снять мут', level: 1 },
  { value: 'player_info', label: 'Информация об игроке', level: 2 },
  { value: 'privilege_restriction', label: 'Временное ограничение', level: 3 },
  { value: 'report', label: '/report — временное ограничение', level: 3 },
  { value: 'unreport', label: '/unreport — снять временное ограничение', level: 3 },
  { value: 'server_manage', label: 'Управление сервером', level: 4 },
  { value: 'console_command', label: 'Команда консоли', level: 5 },
];

const styles: Record<string, React.CSSProperties> = {
  panel: {
    margin: '10px 0',
    padding: 14,
    borderRadius: 14,
    border: '1px solid #343044',
    background: '#11111a',
    color: '#f5f3ff',
  },
  input: {
    width: '100%',
    boxSizing: 'border-box',
    padding: 10,
    borderRadius: 9,
    border: '1px solid #39364b',
    background: '#191925',
    color: 'white',
    marginTop: 6,
  },
  button: {
    width: '100%',
    padding: 11,
    border: 0,
    borderRadius: 9,
    background: '#8b5cf6',
    color: 'white',
    fontWeight: 700,
    marginTop: 10,
  },
};

export default function RconDrawerEntry() {
  const [visible, setVisible] = useState(false);
  const [opened, setOpened] = useState(false);
  const [data, setData] = useState<RconData | null>(null);
  const [action, setAction] = useState('say');
  const [target, setTarget] = useState('');
  const [message, setMessage] = useState('');
  const [reason, setReason] = useState('');
  const [command, setCommand] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    try {
      const response = await fetch('/api/rcon', { cache: 'no-store' });
      const result = await response.json();

      if (!response.ok) {
        setVisible(false);
        return;
      }

      setData(result);
      setVisible(Boolean(Number(result?.access?.access_level) >= 1 && Number(result?.access?.access_level) <= 5));
    } catch {
      setNotice('Не удалось загрузить RCON-панель.');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const level = Number(data?.access?.access_level ?? 0);
  const selectedAction = ACTIONS.find(item => item.value === action);
  const needsTarget = !['say', 'console_command'].includes(action);

  async function sendAction(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (busy || !selectedAction || level < selectedAction.level) return;

    if (action === 'console_command' && !command.trim()) {
      setNotice('Введи команду консоли.');
      return;
    }

    if (action === 'say' && !message.trim()) {
      setNotice('Введи сообщение.');
      return;
    }

    if (needsTarget && !target.trim()) {
      setNotice('Укажи ник игрока.');
      return;
    }

    setBusy(true);
    setNotice('');

    const payload: Record<string, string> = { action };

    if (action === 'say') payload.message = message.trim();
    if (needsTarget) payload.username = target.trim();
    if (['ban', 'mute', 'kick'].includes(action)) {
      payload.reason = reason.trim();
    }
    if (action === 'console_command') payload.command = command.trim();

    try {
      const response = await fetch('/api/rcon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      setNotice(result.message || result.error || 'Получен ответ от API.');

      if (result.executed) {
        setMessage('');
        setTarget('');
        setReason('');
        setCommand('');
      }

      await load();
    } catch {
      setNotice('Ошибка связи с API RCON.');
    } finally {
      setBusy(false);
    }
  }

  if (!visible) return null;

  const history = data?.history ?? [];

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpened(value => !value)}
        aria-expanded={opened}
      >
        🎮 <span>RCON-чат</span><b>{opened ? '⌄' : '›'}</b>
      </button>

      {opened && (
        <section style={styles.panel} aria-label="RCON-чат">
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
            <strong>HYPEGO / RCON</strong>
            <button type="button" onClick={() => setOpened(false)}>×</button>
          </div>

          <p style={{ fontSize: 12, color: '#aaa5bd' }}>
            Уровень доступа: {level || 'не выдан'}
          </p>

          <div
            role="status"
            style={{
              padding: 10,
              borderRadius: 8,
              background: '#29202a',
              fontSize: 12,
              marginBottom: 12,
            }}
          >
            ● Minecraft не подключён. Команды пока не выполняются.
          </div>

          {level > 0 ? (
            <form onSubmit={sendAction}>
              <label style={{ display: 'block', fontSize: 13 }}>
                Действие
                <select
                  style={styles.input}
                  value={action}
                  onChange={event => setAction(event.target.value)}
                >
                  {ACTIONS.filter(item => item.level <= level).map(item => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>

              {action === 'say' && (
                <label style={{ display: 'block', marginTop: 10, fontSize: 13 }}>
                  Сообщение
                  <textarea
                    style={styles.input}
                    value={message}
                    onChange={event => setMessage(event.target.value)}
                    maxLength={300}
                    rows={3}
                    placeholder="Сообщение для игрового чата"
                    required
                  />
                </label>
              )}

              {needsTarget && (
                <label style={{ display: 'block', marginTop: 10, fontSize: 13 }}>
                  Ник игрока
                  <input
                    style={styles.input}
                    value={target}
                    onChange={event => setTarget(event.target.value)}
                    maxLength={32}
                    placeholder="Ник игрока"
                    required
                  />
                </label>
              )}

              {['ban', 'mute', 'kick'].includes(action) && (
                <label style={{ display: 'block', marginTop: 10, fontSize: 13 }}>
                  Причина
                  <input
                    style={styles.input}
                    value={reason}
                    onChange={event => setReason(event.target.value)}
                    maxLength={300}
                    placeholder="Причина действия"
                  />
                </label>
              )}

              {action === 'console_command' && (
                <label style={{ display: 'block', marginTop: 10, fontSize: 13 }}>
                  Команда без начального /
                  <textarea
                    style={styles.input}
                    value={command}
                    onChange={event => setCommand(event.target.value)}
                    maxLength={500}
                    rows={3}
                    placeholder="Введите команду консоли"
                    required
                  />
                </label>
              )}

              <button type="submit" style={styles.button} disabled={busy}>
                {busy ? 'Отправка…' : 'Отправить команду'}
              </button>
            </form>
          ) : (
            <p style={{ fontSize: 13 }}>Управление командами недоступно без выданного уровня RCON.</p>
          )}

          {notice && (
            <p role="status" style={{ fontSize: 12, overflowWrap: 'anywhere' }}>
              {notice}
            </p>
          )}

          <div style={{ marginTop: 18, borderTop: '1px solid #343044', paddingTop: 12 }}>
            <strong>Моя история</strong>
            <p style={{ fontSize: 11, color: '#aaa5bd' }}>
              Последние 50 действий твоего аккаунта
            </p>

            {history.length === 0 ? (
              <p style={{ fontSize: 12, color: '#aaa5bd' }}>
                Записей пока нет или история ещё не загружена.
              </p>
            ) : (
              <div style={{ maxHeight: 260, overflowY: 'auto' }}>
                {history.map(entry => (
                  <article
                    key={entry.id}
                    style={{
                      borderTop: '1px solid #292638',
                      padding: '9px 0',
                      fontSize: 12,
                      overflowWrap: 'anywhere',
                    }}
                  >
                    <strong>{entry.action}</strong>
                    {entry.target_username && <span> · {entry.target_username}</span>}
                    <div style={{ color: '#aaa5bd', marginTop: 4 }}>
                      {entry.result === 'blocked' ? 'Не выполнено' : entry.result}
                      {' · уровень '}{entry.access_level}
                    </div>
                    <div style={{ color: '#aaa5bd', marginTop: 3 }}>
                      {new Date(entry.created_at).toLocaleString('ru-RU')}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
