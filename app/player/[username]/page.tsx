"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useParams } from "next/navigation";
import MusicPlayer from "./MusicPlayer";

type WallPost = {
  id: string;
  body: string;
  created_at: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  nickname_color: string | null;
};

export default function PlayerProfilePage() {
  const params = useParams<{ username: string }>();
  const username = decodeURIComponent(String(params.username || ""));

  const [player, setPlayer] = useState<any>(null);
  const [viewer, setViewer] = useState<any>(null);
  const [posts, setPosts] = useState<WallPost[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [wallLoading, setWallLoading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");
  const [wallError, setWallError] = useState("");
  const [notice, setNotice] = useState("");
  const [friendStatus, setFriendStatus] = useState<"none"|"outgoing"|"incoming"|"accepted">("none");
  const [friendBusy, setFriendBusy] = useState(false);

  useEffect(() => {
    if (!viewer?.id || !player?.id || viewer.id === player.id) return;

    fetch("/api/friends/search?q=" + encodeURIComponent(player.username))
      .then(async (r) => (r.ok ? r.json() : null))
      .then((data) => {
        const found = data?.players?.find((p: any) => p.id === player.id);
        setFriendStatus(found?.friendship_status || "none");
      })
      .catch(() => setFriendStatus("none"));
  }, [viewer?.id, player?.id, player?.username]);

  async function handleFriendAction() {
    if (!viewer) {
      setNotice("Войди в аккаунт, чтобы добавлять игроков в друзья.");
      return;
    }

    if (!player?.id || viewer.id === player.id) return;
    setFriendBusy(true);
    setNotice("");

    try {
      if (friendStatus === "incoming") {
        const r = await fetch("/api/friends/respond", {
          method: "POST",
          headers: {"Content-Type":"application/json"},
          body: JSON.stringify({user_id: player.id, action:"accept"}),
        });
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || "Не удалось принять заявку");
        setFriendStatus("accepted");
        setNotice("Заявка в друзья принята.");
      } else if (friendStatus === "none") {
        const r = await fetch("/api/friends/request", {
          method: "POST",
          headers: {"Content-Type":"application/json"},
          body: JSON.stringify({user_id: player.id}),
        });
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || "Не удалось отправить заявку");
        setFriendStatus("outgoing");
        setNotice(data.message || "Заявка в друзья отправлена.");
      }
    } catch (e: any) {
      setNotice(e.message || "Не удалось изменить статус дружбы.");
    } finally {
      setFriendBusy(false);
    }
  }


  useEffect(() => {
    let active = true;

    setLoading(true);
    setError("");
    setPlayer(null);
    setPosts([]);

    fetch("/api/player?username=" + encodeURIComponent(username))
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || "Игрок не найден");
        return {
        ...data.player,
        roles: data.roles || [],
        privileges: data.privileges || [],
        };
      })
      .then((p) => {
        if (active) setPlayer(p);
      })
      .catch((e) => {
        if (active) setError(e.message || "Не удалось загрузить профиль");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    fetch("/api/me")
      .then(async (r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (active) setViewer(data?.user || null);
      })
      .catch(() => {
        if (active) setViewer(null);
      });

    return () => {
      active = false;
    };
  }, [username]);

  const loadWall = useCallback(async () => {
    if (!player?.id) return;

    setWallLoading(true);
    setWallError("");

    try {
      const r = await fetch("/api/wall?user_id=" + encodeURIComponent(player.id));
      const data = await r.json();

      if (!r.ok) throw new Error(data.error || "Не удалось загрузить стену");
      setPosts(Array.isArray(data.posts) ? data.posts : []);
    } catch (e: any) {
      setWallError(e.message || "Ошибка загрузки стены");
    } finally {
      setWallLoading(false);
    }
  }, [player?.id]);

  useEffect(() => {
    loadWall();
  }, [loadWall]);

  async function submitPost(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setNotice("");
    setWallError("");

    const body = draft.trim();

    if (!viewer) {
      setNotice("Войди в аккаунт, чтобы оставить сообщение на стене.");
      return;
    }

    if (!body) {
      setWallError("Напиши сообщение перед публикацией.");
      return;
    }

    if (body.length > 500) {
      setWallError("Сообщение не должно превышать 500 символов.");
      return;
    }

    setPosting(true);

    try {
      const r = await fetch("/api/wall", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: player.id, body }),
      });

      const data = await r.json();

      if (!r.ok) throw new Error(data.error || "Не удалось опубликовать сообщение");

      setDraft("");
      setNotice("Сообщение опубликовано.");
      await loadWall();
    } catch (e: any) {
      setWallError(e.message || "Ошибка публикации");
    } finally {
      setPosting(false);
    }
  }

  if (loading) {
    return <main className="publicProfilePage"><div className="publicProfileState">Загружаем профиль игрока…</div></main>;
  }

  if (error || !player) {
    return (
      <main className="publicProfilePage">
        <div className="publicProfileState">
          <span className="eyebrow">HYPEGO / PLAYER</span>
          <h1>Игрок не найден</h1>
          <p>{error || "Профиль недоступен."}</p>
          <a className="primary publicProfileBack" href="/">← Вернуться на Hypego</a>
        </div>
      </main>
    );
  }

  const displayName = player.display_name || player.username;
  const avatarLetter = String(displayName || "?").slice(0, 1).toUpperCase();

  return (
    <main className="publicProfilePage">
      <a className="publicProfileHome" href="/">← HYPEGO</a>

      <section
        className="publicProfileBanner"
        style={player.banner_url ? {
          backgroundImage:
            "linear-gradient(90deg,rgba(9,11,18,.94),rgba(12,14,25,.55)),url(" +
            JSON.stringify(player.banner_url) + ")",
        } : undefined}
      >
        
            <div className="publicProfileIdentity">
          <div className={`publicProfileAvatar avatar-frame-${player.avatar_frame||"none"}`}>
            {player.avatar_url
              ? <img src={player.avatar_url} alt={"Аватар " + displayName} />
              : avatarLetter}
          </div>

          <div className="publicProfileName">
            <span className="eyebrow">PLAYER PROFILE</span>
            <h1 className={`nickname-effect-${player.nickname_effect||"none"}`} style={{ color: player.nickname_color || "#c4b5fd" }}>
              {displayName}
            </h1>
            <p>@{player.username}</p>

            {viewer && viewer.id !== player.id && (
              <button
                type="button"
                className="outline publicProfileFriendButton"
                onClick={handleFriendAction}
                disabled={friendBusy || friendStatus === "accepted" || friendStatus === "outgoing"}
              >
                {friendStatus === "accepted"
                  ? "✓ В друзьях"
                  : friendStatus === "outgoing"
                    ? "⌛ Заявка отправлена"
                    : friendStatus === "incoming"
                      ? "✓ Принять заявку"
                      : "＋ Добавить в друзья"}
              </button>
            )}

            <div className="publicProfileBadges">
              <span>✦ Игрок Hypego</span>
              <span>◷ С нами с {player.created_at
                ? new Date(player.created_at).toLocaleDateString("ru-RU")
                : "—"}</span>
            </div>
          </div>
        </div>
        <div className="publicProfileWatermark">H+</div>
      </section>

      <MusicPlayer username={username} />

      <div className="publicProfileGrid">
        <section className="publicProfileCard publicProfileAbout">
          <div className="publicProfileSectionTitle">
            <div>
              <span className="eyebrow">ABOUT PLAYER</span>
              <h2>Об игроке</h2>
            </div>
            <span className="publicProfileIcon">◇</span>
          </div>
          <p className="publicProfileBio">
            {player.bio || "Этот игрок пока ничего не рассказал о себе."}
          </p>

          <div className="publicProfileMeta">
            <span>ИГРОК</span>
            <strong className={`nickname-effect-${player.nickname_effect||"none"}`} style={{ color: player.nickname_color || "#c4b5fd" }}>
              {displayName}
            </strong>
          </div>
          <div className="publicProfileMeta">
            <span>ДАТА РЕГИСТРАЦИИ</span>
            <strong>{player.created_at
              ? new Date(player.created_at).toLocaleDateString("ru-RU")
              : "Не указана"}</strong>
          </div>
        </section>

        {/* PUBLIC_PROFILE_ROLES_PRIVILEGES */}
        <section className="publicProfileCard">
          <div className="publicProfileSectionTitle">
            <div>
              <span className="eyebrow">HYPEGO STATUS</span>
              <h2>Должности и привилегии</h2>
            </div>
            <span className="publicProfileIcon">✧</span>
          </div>

          <div className="publicProfileMeta">
            <span>ГРУППА</span>
            <strong>
              {player.roles?.some((r: any) => r.id === "owner")
                ? "Владелец проекта"
                : player.roles?.some((r: any) => ["deputy", "management"].includes(r.id))
                  ? "Руководство"
                  : player.roles?.some((r: any) => ["curator", "tech_admin", "support", "moderator", "trainee"].includes(r.id))
                    ? "Персонал"
                    : "Игрок"}
            </strong>
          </div>

          <div className="publicProfileMeta">
            <span>ДОЛЖНОСТИ НА САЙТЕ</span>
            <strong>
              {player.roles?.length
                ? player.roles.map((r: any) => r.title).join(", ")
                : "Нет специальных должностей"}
            </strong>
          </div>

          <div className="publicProfileMeta">
            <span>ПРИВИЛЕГИИ MINECRAFT</span>
            <strong>
              {player.privileges?.length
                ? player.privileges.map((p: any, i: number) => (
                    <span key={`${p.server_name}-${p.product_name}-${i}`} style={{ display: "block", marginTop: 6 }}>
                      {p.product_name} — {p.server_name}
                      
                    </span>
                  ))
                : "Активных игровых привилегий нет"}
            </strong>
          </div>
        </section>

        <section className="publicProfileCard">
          <div className="publicProfileSectionTitle">
            <div>
              <span className="eyebrow">CONTACTS</span>
              <h2>Ссылки</h2>
            </div>
            <span className="publicProfileIcon">↗</span>
          </div>

          <div className="publicProfileLinks">
            {player.vk_url && (
              <a href={player.vk_url} target="_blank" rel="noopener noreferrer">
                <span>ВКонтакте</span><b>↗</b>
              </a>
            )}
            {player.telegram_username && (
              <a
                href={"https://t.me/" + encodeURIComponent(String(player.telegram_username).replace(/^@/, ""))}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span>Telegram · @{String(player.telegram_username).replace(/^@/, "")}</span>
                <b>↗</b>
              </a>
            )}
            {!player.vk_url && !player.telegram_username && (
              <p className="publicProfileMuted">Игрок пока не добавил ссылки.</p>
            )}
          </div>
        </section>

        <section className="publicProfileCard publicProfileWall">
          <div className="publicProfileSectionTitle">
            <div>
              <span className="eyebrow">COMMUNITY</span>
              <h2>Стена профиля</h2>
            </div>
            <span className="publicProfilePostCount">{posts.length}</span>
          </div>

          <p className="publicProfileMuted">
            Оставляй сообщения и общайся с игроком.
          </p>

          {viewer ? (
            <form className="publicProfilePostForm" onSubmit={submitPost}>
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value.slice(0, 500))}
                placeholder="Напиши сообщение игроку…"
                maxLength={500}
                rows={3}
              />
              <div className="publicProfileFormBottom">
                <span>{draft.length}/500</span>
                <button className="primary" type="submit" disabled={posting || !draft.trim()}>
                  {posting ? "Публикуем…" : "Опубликовать"}
                </button>
              </div>
            </form>
          ) : (
            <div className="publicProfileLoginHint">
              <span>◈</span>
              <p>Войди в аккаунт Hypego, чтобы оставить сообщение.</p>
              <a href="/?tab=auth">Войти в аккаунт ↗</a>
            </div>
          )}

          {notice && <p className="publicProfileNotice">{notice}</p>}
          {wallError && <p className="publicProfileError">{wallError}</p>}

          <div className="publicProfilePosts">
            {wallLoading && <p className="publicProfileMuted">Загружаем сообщения…</p>}

            {!wallLoading && posts.length === 0 && (
              <div className="publicProfileEmptyWall">
                <span>◇</span>
                <strong>Пока здесь тихо</strong>
                <p>Стань первым, кто оставит сообщение!</p>
              </div>
            )}

            {posts.map((post) => (
              <article className="publicProfilePost" key={post.id}>
                <div className="publicProfilePostAvatar">
                  {post.avatar_url
                    ? <img src={post.avatar_url} alt="" />
                    : String(post.display_name || post.username || "?").slice(0, 1).toUpperCase()}
                </div>
                <div className="publicProfilePostContent">
                  <div className="publicProfilePostHeader">
                    <strong style={{ color: post.nickname_color || "#c4b5fd" }}>
                      {post.display_name || post.username}
                    </strong>
                    <span>
                      {post.created_at
                        ? new Date(post.created_at).toLocaleString("ru-RU", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })
                        : ""}
                    </span>
                  </div>
                  <p>{post.body}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
