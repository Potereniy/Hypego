"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function PlayerProfilePage() {
  const params = useParams<{ username: string }>();
  const username = decodeURIComponent(String(params.username || ""));
  const [player, setPlayer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetch("/api/player?username=" + encodeURIComponent(username))
      .then(async r => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || "Игрок не найден");
        return data.player;
      })
      .then(p => { if (active) setPlayer(p); })
      .catch(e => { if (active) setError(e.message || "Не удалось загрузить профиль"); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [username]);

  const panel: React.CSSProperties = {
    width: "min(760px, 100%)", margin: "32px auto", padding: "24px",
    border: "1px solid var(--border, #333)", borderRadius: "20px",
    background: "var(--panel, #15151b)", color: "var(--foreground, #f5f5f5)",
    boxSizing: "border-box"
  };

  if (loading) return <main style={panel}>Загружаем профиль игрока…</main>;
  if (error || !player) return <main style={panel}>
    <h2>Игрок не найден</h2><p>{error || "Профиль недоступен."}</p>
    <a href="/" style={{ color: "#a78bfa" }}>← Вернуться на Hypego</a>
  </main>;

  return <main style={panel}>
    <a href="/" style={{ color: "#a78bfa", textDecoration: "none" }}>← Hypego</a>
    {player.banner_url && <img src={player.banner_url} alt="Обложка профиля"
      style={{ width: "100%", height: 180, objectFit: "cover", borderRadius: 14, marginTop: 20 }} />}
    <div style={{ display: "flex", gap: 18, alignItems: "center", marginTop: 24, flexWrap: "wrap" }}>
      <div style={{ width: 88, height: 88, borderRadius: "50%", overflow: "hidden",
        display: "grid", placeItems: "center", background: "#292532", fontSize: 34, flexShrink: 0 }}>
        {player.avatar_url
          ? <img src={player.avatar_url} alt="Аватар" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : String(player.username || "?").slice(0, 1).toUpperCase()}
      </div>
      <div>
        <h1 style={{ margin: 0, color: player.nickname_color || "#a78bfa", overflowWrap: "anywhere" }}>
          {player.display_name || player.username}
        </h1>
        <div style={{ opacity: .7, marginTop: 6 }}>@{player.username}</div>
      </div>
    </div>
    <section style={{ marginTop: 28 }}>
      <h3>Об игроке</h3>
      <p style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
        {player.bio || "Игрок пока ничего не рассказал о себе."}
      </p>
      <p style={{ opacity: .7, fontSize: 14 }}>
        В Hypego с {player.created_at ? new Date(player.created_at).toLocaleDateString("ru-RU") : "—"}
      </p>
    </section>
    {(player.vk_url || player.telegram_username) && <section style={{ marginTop: 24 }}>
      <h3>Ссылки</h3>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        {player.vk_url && <a href={player.vk_url} target="_blank" rel="noopener noreferrer"
          style={{ color: "#a78bfa" }}>ВКонтакте ↗</a>}
        {player.telegram_username && <a href={"https://t.me/" + encodeURIComponent(player.telegram_username)}
          target="_blank" rel="noopener noreferrer" style={{ color: "#a78bfa" }}>Telegram ↗</a>}
      </div>
    </section>}
  </main>;
}
