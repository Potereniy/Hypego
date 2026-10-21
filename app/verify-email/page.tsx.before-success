'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [message, setMessage] = useState('Проверяем ссылку подтверждения...');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    let cancelled = false;

    async function verify() {
      if (!token) {
        setMessage('В ссылке отсутствует токен подтверждения. Запросите новое письмо.');
        setStatus('error');
        return;
      }

      try {
        const response = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        const data = await response.json().catch(() => ({}));

        if (cancelled) return;

        if (!response.ok) {
          setMessage(data.message || data.error || 'Не удалось подтвердить email. Возможно, ссылка истекла или уже использована.');
          setStatus('error');
          return;
        }

        setMessage(data.message || 'Email успешно подтверждён! Теперь вы можете войти в Hypego.');
        setStatus('success');
      } catch {
        if (cancelled) return;
        setMessage('Не удалось связаться с сервером. Проверьте интернет и попробуйте снова.');
        setStatus('error');
      }
    }

    verify();

    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      boxSizing: 'border-box',
      background: 'radial-gradient(ellipse at top, #211447 0%, #0b0d18 55%, #070910 100%)',
      color: '#eef0ff',
      fontFamily: 'Arial, sans-serif',
    }}>
      <section style={{
        width: '100%',
        maxWidth: 440,
        padding: 32,
        boxSizing: 'border-box',
        border: '1px solid #39305e',
        borderRadius: 20,
        background: 'rgba(17, 20, 38, 0.96)',
        textAlign: 'center',
        boxShadow: '0 20px 70px rgba(107, 67, 220, 0.15)',
      }}>
        <div style={{
          fontSize: 32,
          fontWeight: 900,
          letterSpacing: 4,
          marginBottom: 8,
        }}>
          HYPE<span style={{ color: '#a78bfa' }}>GO</span>
        </div>

        <div style={{
          width: 56,
          height: 4,
          borderRadius: 8,
          background: '#9065ff',
          margin: '22px auto',
        }} />

        <h1 style={{ fontSize: 23, marginBottom: 16 }}>
          {status === 'loading'
            ? 'Подтверждение email'
            : status === 'success'
              ? 'Всё готово!'
              : 'Не получилось'}
        </h1>

        <p style={{
          color: '#c2c6dc',
          fontSize: 15,
          lineHeight: 1.7,
          overflowWrap: 'anywhere',
        }}>
          {message}
        </p>

        {status === 'loading' && (
          <div style={{ color: '#a78bfa', marginTop: 20 }}>
            Пожалуйста, подождите…
          </div>
        )}

        {status !== 'loading' && (
          <a href="/" style={{
            display: 'inline-block',
            marginTop: 22,
            padding: '13px 24px',
            borderRadius: 10,
            background: '#8057ed',
            color: '#fff',
            textDecoration: 'none',
            fontWeight: 700,
          }}>
            Перейти на Hypego
          </a>
        )}

        <p style={{
          marginTop: 28,
          marginBottom: 0,
          color: '#777e9a',
          fontSize: 12,
        }}>
          HYPEGO · Играй. Общайся. Создавай своё.
        </p>
      </section>
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <main style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        background: '#0b0d18',
        color: '#c2c6dc',
        fontFamily: 'Arial, sans-serif',
      }}>
        Загружаем Hypego…
      </main>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
