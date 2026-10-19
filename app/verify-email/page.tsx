'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [message, setMessage] = useState('Подтверждаем ваш аккаунт...');
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
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });

        const data = await response.json().catch(() => ({}));

        if (cancelled) return;

        if (!response.ok) {
          setMessage(
            data.message ||
            data.error ||
            'Не удалось подтвердить аккаунт. Возможно, ссылка уже использована или истекла.'
          );
          setStatus('error');
          return;
        }

        setMessage(
          data.message ||
          'Ваш email успешно подтверждён. Теперь вы можете закрыть это окно и войти в свой аккаунт на Hypego.'
        );
        setStatus('success');
      } catch {
        if (cancelled) return;

        setMessage(
          'Не удалось связаться с сервером. Проверьте интернет и попробуйте ещё раз.'
        );
        setStatus('error');
      }
    }

    verify();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const isSuccess = status === 'success';

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        boxSizing: 'border-box',
        background:
          'radial-gradient(circle at top, #24144a 0%, #0c0e19 48%, #070910 100%)',
        color: '#eef0ff',
        fontFamily: 'Arial, Helvetica, sans-serif',
      }}
    >
      <section
        style={{
          width: '100%',
          maxWidth: '470px',
          padding: '38px 30px',
          boxSizing: 'border-box',
          border: '1px solid #3b3162',
          borderRadius: '22px',
          background: 'rgba(16, 19, 35, 0.97)',
          textAlign: 'center',
          boxShadow: '0 25px 80px rgba(120, 70, 240, 0.18)',
        }}
      >
        <div
          style={{
            fontSize: '32px',
            fontWeight: 900,
            letterSpacing: '4px',
            marginBottom: '8px',
          }}
        >
          HYPE<span style={{ color: '#a78bfa' }}>GO</span>
        </div>

        <div
          style={{
            width: '55px',
            height: '4px',
            borderRadius: '10px',
            background: '#9065ff',
            margin: '24px auto 28px',
          }}
        />

        {status === 'loading' && (
          <>
            <div
              style={{
                width: '58px',
                height: '58px',
                margin: '0 auto 24px',
                borderRadius: '50%',
                border: '4px solid #29243f',
                borderTopColor: '#9b72ff',
                boxSizing: 'border-box',
                animation: 'spin 1s linear infinite',
              }}
            />

            <h1
              style={{
                margin: '0 0 14px',
                fontSize: '25px',
                color: '#ffffff',
              }}
            >
              Подтверждаем аккаунт
            </h1>

            <p
              style={{
                margin: 0,
                color: '#aeb4ca',
                fontSize: '15px',
                lineHeight: 1.7,
              }}
            >
              Пожалуйста, подождите...
            </p>
          </>
        )}

        {isSuccess && (
          <>
            <div
              style={{
                width: '70px',
                height: '70px',
                margin: '0 auto 22px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(80, 220, 150, 0.12)',
                border: '1px solid rgba(80, 220, 150, 0.35)',
                color: '#62e6a1',
                fontSize: '36px',
              }}
            >
              ✓
            </div>

            <h1
              style={{
                margin: '0 0 16px',
                fontSize: '26px',
                color: '#ffffff',
              }}
            >
              Аккаунт подтверждён!
            </h1>

            <p
              style={{
                margin: '0 auto',
                maxWidth: '380px',
                color: '#c2c7da',
                fontSize: '15px',
                lineHeight: 1.8,
              }}
            >
              Ваш email успешно подтверждён.
              <br />
              Теперь вы можете закрыть это окно и спокойно войти в свой аккаунт
              на Hypego.
            </p>

            <div
              style={{
                marginTop: '28px',
                padding: '15px 18px',
                borderRadius: '12px',
                background: 'rgba(139, 92, 246, 0.08)',
                border: '1px solid rgba(139, 92, 246, 0.2)',
                color: '#aaa3c7',
                fontSize: '13px',
                lineHeight: 1.6,
              }}
            >
              🔒 Ваш аккаунт защищён.
              <br />
              Ссылка подтверждения больше не может быть использована повторно.
            </div>

                  <a
                    href="/?tab=auth"
                    style={{
                      display: 'block',
                      marginTop: '22px',
                      padding: '14px 20px',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #8b5cf6, #6d45d9)',
                      color: '#ffffff',
                      fontSize: '15px',
                      fontWeight: 700,
                      textDecoration: 'none',
                      boxShadow: '0 8px 24px rgba(139, 92, 246, 0.22)',
                    }}
                  >
                    Перейти ко входу →
                  </a>

          </>
        )}

        {status === 'error' && (
          <>
            <div
              style={{
                width: '70px',
                height: '70px',
                margin: '0 auto 22px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(239, 68, 68, 0.10)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#ff7272',
                fontSize: '30px',
              }}
            >
              !
            </div>

            <h1
              style={{
                margin: '0 0 16px',
                fontSize: '25px',
                color: '#ffffff',
              }}
            >
              Не удалось подтвердить
            </h1>

            <p
              style={{
                margin: 0,
                color: '#c2c7da',
                fontSize: '15px',
                lineHeight: 1.8,
              }}
            >
              {message}
            </p>
          </>
        )}

        <div
          style={{
            marginTop: '32px',
            paddingTop: '20px',
            borderTop: '1px solid #292e43',
            color: '#707790',
            fontSize: '12px',
            lineHeight: 1.7,
          }}
        >
          HYPEGO
          <br />
          Играй. Общайся. Создавай своё.
        </div>
      </section>

      <style>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <main
          style={{
            minHeight: '100vh',
            display: 'grid',
            placeItems: 'center',
            background: '#0b0d18',
            color: '#c2c6dc',
            fontFamily: 'Arial, sans-serif',
          }}
        >
          Загружаем Hypego...
        </main>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
