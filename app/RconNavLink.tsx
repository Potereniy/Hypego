'use client';

import { useEffect, useState } from 'react';

export default function RconNavLink() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let active = true;

    fetch('/api/rcon', { cache: 'no-store' })
      .then(async response => {
        if (!response.ok) return null;
        return response.json();
      })
      .then(data => {
        if (active) { const level = Number(data?.access?.access_level ?? 0); setVisible(data?.canManageAccess === true || (level >= 1 && level <= 5)); }
      })
      .catch(() => {
        if (active) setVisible(false);
      });

    return () => {
      active = false;
    };
  }, []);

  if (!visible) return null;

  return (
    <a
      href="/rcon"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '8px 12px',
        borderRadius: 9,
        color: '#c4b5fd',
        textDecoration: 'none',
        fontWeight: 700,
      }}
    >
      RCON
    </a>
  );
}
