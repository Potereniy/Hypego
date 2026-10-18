'use client';

import { useEffect, useState } from 'react';

export default function ResetPasswordPage() {
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setToken(new URLSearchParams(window.location.search).get('token') || '');
  }, []);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setNotice('');

    if (!token) {
      setNotice('Ссылка недействительна. Запросите новую.');
      return;
    }

    if (password.length < 10) {
      setNotice('Пароль должен содержать минимум 10 символов.');
      return;
    }

    if (password !== confirmPassword) {
      setNotice('Пароли не совпадают.');
      return;
    }

    setBusy(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password, confirmPassword })
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.error || 'Не удалось изменить пароль');
      }

      setSuccess(true);
      setNotice(result.message || 'Пароль изменён. Теперь войдите с новым паролем.');
      setPassword('');
      setConfirmPassword('');
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : 'Не удалось изменить пароль. Попробуйте ещё раз.'
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main>
      <section className="panel authPanel">
        <div className="eyebrow">HYPEGO ACCOUNT</div>
        <h2>Новый пароль</h2>
        <p className="muted">
          Придумайте новый пароль для аккаунта Hypego.
        </p>

        {success ? (
          <>
            <p>{notice}</p>
            <a className="resetLink" href="/">Вернуться на Hypego</a>
          </>
        ) : (
          <form className="form" onSubmit={submit}>
            <label>
              Новый пароль
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="new-password"
                minLength={10}
                required
              />
            </label>

            <label>
              Повторите новый пароль
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                minLength={10}
                required
              />
            </label>

            {notice && <p className="resetNotice" role="status">{notice}</p>}

            <button className="primary big" disabled={busy || !token}>
              {busy ? 'Сохраняем…' : 'Сохранить новый пароль'}
            </button>

            {!token && (
              <p className="muted">
                Ссылка отсутствует или ещё загружается. Откройте ссылку из письма.
              </p>
            )}
          </form>
        )}
      </section>
    </main>
  );
}
