'use client';

import { useCallback, useEffect, useState } from 'react';

type Message = {
  id: string;
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
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
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
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки чата');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMessages();
    const timer = window.setInterval(() => void loadMessages(), 5000);
    return () => window.clearInterval(timer);
  }, [loadMessages]);

  async function sendMessage(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const body = draft.trim();

    if (!body || sending) return;

    setSending(true);
    setError('');

    try {
      const response = await fetch('/api/global-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body }),
      });
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) setLoggedIn(false);
        throw new Error(data.error || 'Не удалось отправить сообщение');
      }

      setDraft('');
      await loadMessages();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка отправки');
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="section globalChatSection" id="global-chat">
      <div className="sectionHead">
        <div>
          <div className="eyebrow">HYPEGO COMMUNITY</div>
          <h2>Общий <em>чат</em></h2>
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

        <div className="globalChatMessages" aria-live="polite">
          {loading && messages.length === 0 ? (
            <p className="globalChatEmpty">Загружаем сообщения…</p>
          ) : messages.length === 0 ? (
            <p className="globalChatEmpty">
              Здесь пока тихо. Стань первым, кто напишет!
            </p>
          ) : (
            messages.map((message) => (
              <article className="globalChatMessage" key={message.id}>
                <div className="globalChatAvatar">
                  {message.avatar_url ? (
                    <img src={message.avatar_url} alt="" />
                  ) : (
                    (message.username || '?').slice(0, 1).toUpperCase()
                  )}
                </div>

                <div className="globalChatMessageContent">
                  <div className="globalChatMessageMeta">
                    <strong
                      style={{
                        color: message.nickname_color || '#a78bfa',
                      }}
                    >
                      {message.display_name || message.username}
                    </strong>
                    <span>@{message.username}</span>
                    <time>
                      {new Date(message.created_at).toLocaleString('ru-RU', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </time>
                  </div>
                  <p>{message.body}</p>
                </div>
              </article>
            ))
          )}
        </div>

        {error && (
          <p className="globalChatError" role="status">{error}</p>
        )}

        {loggedIn ? (
          <form className="globalChatForm" onSubmit={sendMessage}>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Напиши сообщение игрокам…"
              maxLength={500}
              rows={2}
              required
            />
            <div className="globalChatFormBottom">
              <span>{draft.length}/500</span>
              <button
                className="primary"
                type="submit"
                disabled={sending || !draft.trim()}
              >
                {sending ? 'Отправка…' : 'Отправить ↗'}
              </button>
            </div>
          </form>
        ) : (
          <div className="globalChatLogin">
            <span>Чтобы писать в общий чат, войди в аккаунт.</span>
            <a href="/?tab=auth">Войти ↗</a>
          </div>
        )}
      </div>
    </section>
  );
}
