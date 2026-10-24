'use client';

import { useCallback, useEffect, useState } from 'react';
import { EmojiGifTools } from './EmojiGifTools';
import MessageBody from './MessageBody';

type Message = {
  id: string;
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  nickname_color: string | null;
  body: string;
  created_at: string;
};

export default function GlobalChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);
  const [canModerate, setCanModerate] = useState(false);
  const [chatBlocked, setChatBlocked] = useState(false);
  const [chatBlockedUntil, setChatBlockedUntil] = useState<string | null>(null);
  const [chatBlockReason, setChatBlockReason] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [moderating, setModerating] = useState(false);
  const [error, setError] = useState('');

  const loadMessages = useCallback(async () => {
    try {
      const response = await fetch('/api/global-chat', {
        cache: 'no-store',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Не удалось загрузить чат');
      }

      setMessages(data.messages || []);
      setLoggedIn(Boolean(data.loggedIn));
      setCanModerate(Boolean(data.canModerate));
      setChatBlocked(Boolean(data.chatBlocked));
      setChatBlockedUntil(data.chatBlockedUntil || null);
      setChatBlockReason(data.chatBlockReason || null);
      setError('');
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Ошибка загрузки чата'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMessages();

    const timer = window.setInterval(
      () => void loadMessages(),
      5000
    );

    return () => window.clearInterval(timer);
  }, [loadMessages]);

  async function sendMessage(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    const body = draft.trim();

    if (!body || sending || chatBlocked) return;

    setSending(true);
    setError('');

    try {
      const response = await fetch('/api/global-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ body }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          setLoggedIn(false);
        }

        if (response.status === 403) {
          await loadMessages();
        }

        throw new Error(
          data.error || 'Не удалось отправить сообщение'
        );
      }

      setDraft('');
      await loadMessages();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Ошибка отправки'
      );
    } finally {
      setSending(false);
    }
  }

  async function deleteMessage(messageId: string) {
    if (!canModerate || moderating) return;

    const confirmed = window.confirm(
      'Удалить это сообщение из глобального чата?'
    );

    if (!confirmed) return;

    setModerating(true);
    setError('');

    try {
      const response = await fetch(
        `/api/global-chat?id=${encodeURIComponent(messageId)}`,
        {
          method: 'DELETE',
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || 'Не удалось удалить сообщение'
        );
      }

      await loadMessages();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'Ошибка удаления сообщения'
      );
    } finally {
      setModerating(false);
    }
  }

  async function banUser(message: Message) {
    if (!canModerate || moderating) return;

    const durationInput = window.prompt(
      `На сколько минут заблокировать чат игроку @${message.username}?\n\n0 — навсегда.`
    );

    if (durationInput === null) return;

    const duration = Number(durationInput.trim());

    if (
      !Number.isInteger(duration) ||
      duration < 0 ||
      duration > 525600
    ) {
      setError(
        'Некорректный срок. Укажи целое число от 0 до 525600 минут.'
      );
      return;
    }

    const reason = window.prompt(
      `Причина блокировки игрока @${message.username}:`
    );

    if (reason === null) return;

    const cleanReason = reason.trim();

    if (cleanReason.length < 3) {
      setError('Причина блокировки должна содержать минимум 3 символа.');
      return;
    }

    setModerating(true);
    setError('');

    try {
      const response = await fetch('/api/global-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'ban',
          user_id: message.user_id,
          duration_minutes: duration,
          reason: cleanReason,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || 'Не удалось заблокировать чат'
        );
      }

      await loadMessages();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'Ошибка блокировки чата'
      );
    } finally {
      setModerating(false);
    }
  }

  async function unbanUser() {
    if (!canModerate || moderating) return;

    const username = window.prompt(
      'Введи ник игрока, которого нужно разблокировать:'
    );

    if (username === null) return;

    const cleanUsername = username.trim();

    if (!cleanUsername) {
      setError('Ник игрока не указан.');
      return;
    }

    setModerating(true);
    setError('');

    try {
      const response = await fetch('/api/global-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'unban',
          username: cleanUsername,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || 'Не удалось разблокировать игрока'
        );
      }

      if (!data.revoked_count) {
        setError(
          `У игрока @${cleanUsername} нет активной блокировки чата.`
        );
      } else {
        await loadMessages();
      }
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'Ошибка разблокировки'
      );
    } finally {
      setModerating(false);
    }
  }

  return (
    <section
      className="section globalChatSection"
      id="global-chat"
    >
      <div className="sectionHead">
        <div>
          <div className="eyebrow">HYPEGO COMMUNITY</div>
          <h2>
            Общий <em>чат</em>
          </h2>
        </div>

        <p>Общайся с игроками Hypego.</p>
      </div>

      <div className="globalChatPanel">
        <div className="globalChatTop">
          <span className="globalChatOnlineDot" />

          <div>
            <strong>Чат игроков</strong>
            <small>Общение сообщества Hypego</small>
          </div>

          <span className="globalChatCount">
            {messages.length} сообщений
          </span>
        </div>

        {canModerate && (
          <div className="globalChatModerationBar">
            <span>
              🛡️ Режим модерации включён
            </span>

            <button
              type="button"
              onClick={unbanUser}
              disabled={moderating}
            >
              🔓 Разблокировать игрока
            </button>
          </div>
        )}

        {chatBlocked && (
          <div className="globalChatBlocked">
            <strong>🔒 Вам заблокировали возможность писать в чат</strong>

            {chatBlockReason && (
              <span>
                Причина: {chatBlockReason}
              </span>
            )}

            <span>
              Срок:{' '}
              {chatBlockedUntil
                ? new Date(chatBlockedUntil).toLocaleString(
                    'ru-RU'
                  )
                : 'навсегда'}
            </span>
          </div>
        )}

        <div
          className="globalChatMessages"
          aria-live="polite"
        >
          {loading && messages.length === 0 ? (
            <p className="globalChatEmpty">
              Загружаем сообщения…
            </p>
          ) : messages.length === 0 ? (
            <p className="globalChatEmpty">
              Здесь пока тихо. Стань первым, кто напишет!
            </p>
          ) : (
            messages.map((message) => (
              <article
                className="globalChatMessage"
                key={message.id}
              >
                <div className="globalChatAvatar">
                  {message.avatar_url ? (
                    <img
                      src={message.avatar_url}
                      alt=""
                    />
                  ) : (
                    (message.username || '?')
                      .slice(0, 1)
                      .toUpperCase()
                  )}
                </div>

                <div className="globalChatMessageContent">
                  <div className="globalChatMessageMeta">
                    <strong
                      style={{
                        color:
                          message.nickname_color ||
                          '#a78bfa',
                      }}
                    >
                      {message.display_name ||
                        message.username}
                    </strong>

                    <span>
                      @{message.username}
                    </span>

                    <time>
                      {new Date(
                        message.created_at
                      ).toLocaleString('ru-RU', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </time>
                  </div>

                  <p><MessageBody body={message.body} /></p>

                  {canModerate && (
                    <div className="globalChatMessageModeration">
                      <button
                        type="button"
                        onClick={() =>
                          deleteMessage(message.id)
                        }
                        disabled={moderating}
                      >
                        🗑️ Удалить
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          banUser(message)
                        }
                        disabled={moderating}
                      >
                        🔒 Заблокировать чат
                      </button>
                    </div>
                  )}
                </div>
              </article>
            ))
          )}
        </div>

        {error && (
          <p
            className="globalChatError"
            role="status"
          >
            {error}
          </p>
        )}

        {loggedIn && !chatBlocked ? (
          <form
            className="globalChatForm"
            onSubmit={sendMessage}
          >
            <textarea
              value={draft}
              onChange={(e) =>
                setDraft(e.target.value)
              }
              placeholder="Напиши сообщение игрокам…"
              maxLength={500}
              rows={2}
              required
            />
            <EmojiGifTools value={draft} onChange={setDraft} maxLength={500} />

            <div className="globalChatFormBottom">
              <span>
                {draft.length}/500
              </span>

              <button
                className="primary"
                type="submit"
                disabled={
                  sending ||
                  !draft.trim()
                }
              >
                {sending
                  ? 'Отправка…'
                  : 'Отправить ↗'}
              </button>
            </div>
          </form>
        ) : chatBlocked ? (
          <div className="globalChatLogin">
            <span>
              Возможность отправлять сообщения временно
              заблокирована.
            </span>
          </div>
        ) : (
          <div className="globalChatLogin">
            <span>
              Чтобы писать в общий чат, войди в аккаунт.
            </span>

            <a href="/?tab=auth">
              Войти ↗
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
