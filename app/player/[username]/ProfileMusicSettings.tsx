"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";

type Track = {
  id: string;
  title: string;
  artist: string;
  audio_url: string;
  cover_url: string | null;
};

type Source = "file" | "youtube" | "spotify" | "vk" | "audio-url";

export default function ProfileMusicSettings({ username }: { username: string }) {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [source, setSource] = useState<Source>("file");
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [url, setUrl] = useState("");
  const [cover, setCover] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);

  const loadTracks = useCallback(async () => {
    try {
      const r = await fetch("/api/profile/tracks?username=" + encodeURIComponent(username));
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Не удалось загрузить список");
      setTracks(Array.isArray(j.tracks) ? j.tracks : []);
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    void loadTracks();
  }, [loadTracks]);

  async function requestJson(path: string, body: unknown) {
    const r = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const j = await r.json();
    if (!r.ok) throw new Error(j.error || "Ошибка запроса");
    return j;
  }

  function validateSource(raw: string) {
    let parsed: URL;
    try {
      parsed = new URL(raw);
    } catch {
      throw new Error("Вставь полную ссылку, начинающуюся с https://");
    }
    if (parsed.protocol !== "https:") {
      throw new Error("Разрешены только HTTPS-ссылки");
    }

    const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
    if (source === "youtube" &&
      !["youtube.com", "m.youtube.com", "music.youtube.com", "youtu.be", "youtube-nocookie.com"].includes(host)) {
      throw new Error("Нужна ссылка на YouTube или YouTube Music");
    }
    if (source === "spotify" && host !== "open.spotify.com" && host !== "spotify.link") {
      throw new Error("Нужна ссылка на Spotify");
    }
    if (source === "vk" && !["vk.com", "m.vk.com", "vk.ru", "m.vk.ru"].includes(host)) {
      throw new Error("Нужна ссылка на VK");
    }
    return parsed.href;
  }

  async function addTrack(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setNotice("");

    try {
      if (tracks.length >= 20) {
        throw new Error("В плейлисте может быть не больше 20 треков");
      }

      let audioUrl = "";

      if (source === "file") {
        if (!file) throw new Error("Выбери аудиофайл на телефоне");
        if (file.size > 20 * 1024 * 1024) {
          throw new Error("Максимальный размер файла — 20 МБ");
        }

        const fd = new FormData();
        fd.set("file", file);
        const response = await fetch("/api/profile/music-upload", {
          method: "POST",
          body: fd,
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Не удалось загрузить файл");
        audioUrl = result.url;
      } else {
        audioUrl = validateSource(url);
      }

      const finalTitle = title.trim() ||
        (source === "file" ? file?.name.replace(/\.[^.]+$/, "") : "");
      if (!finalTitle) throw new Error("Укажи название песни");

      await requestJson("/api/profile/tracks", {
        title: finalTitle,
        artist: artist.trim(),
        audio_url: audioUrl,
        cover_url: cover.trim(),
      });

      setTitle("");
      setArtist("");
      setUrl("");
      setCover("");
      setFile(null);
      setNotice("Трек добавлен в плейлист.");
      await loadTracks();
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Не удалось добавить трек");
    } finally {
      setBusy(false);
    }
  }

  async function removeTrack(id: string) {
    if (!window.confirm("Удалить этот трек из плейлиста?")) return;
    setNotice("");
    try {
      const r = await fetch("/api/profile/tracks", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Не удалось удалить трек");
      setTracks(old => old.filter(track => track.id !== id));
      setNotice("Трек удалён.");
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Ошибка удаления");
    }
  }

  return (
    <div className="panel form profileSettingsCard profileMusicManager">
      <div className="profileCardHeading">
        <div>
          <div className="eyebrow">HYPEGO SOUND SYSTEM</div>
          <h3>Музыка профиля</h3>
        </div>
        <span className="profileCardIcon">♫</span>
      </div>

      <p className="tiny">
        Добавляй собственные аудиофайлы или ссылки на песни и плейлисты.
        Максимум — 20 записей.
      </p>

      <form className="form" onSubmit={addTrack}>
        <label>Источник музыки
          <select value={source} onChange={e => setSource(e.target.value as Source)}>
            <option value="file">Загрузить файл с телефона</option>
            <option value="youtube">YouTube / YouTube Music</option>
            <option value="spotify">Spotify</option>
            <option value="vk">VK / VK Музыка</option>
            <option value="audio-url">Прямая ссылка на аудиофайл</option>
          </select>
        </label>

        {source === "file" ? (
          <label>Аудиофайл
            <input
              type="file"
              accept="audio/*,.mp3,.m4a,.aac,.wav,.ogg,.webm,.flac"
              onChange={e => setFile(e.target.files?.[0] || null)}
            />
          </label>
        ) : (
          <label>
            {source === "youtube" ? "Ссылка на видео или плейлист YouTube"
              : source === "spotify" ? "Ссылка на трек, альбом или плейлист Spotify"
              : source === "vk" ? "Ссылка на песню или плейлист VK"
              : "Прямая HTTPS-ссылка на аудиофайл"}
            <input
              type="url"
              required
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder={
                source === "youtube" ? "https://youtube.com/watch?v=..."
                  : source === "spotify" ? "https://open.spotify.com/track/..."
                  : source === "vk" ? "https://vk.com/..."
                  : "https://example.com/music.mp3"
              }
            />
          </label>
        )}

        <label>Название песни / плейлиста
          <input value={title} onChange={e => setTitle(e.target.value)}
            maxLength={120} placeholder="Например, Ночная дорога" />
        </label>

        <label>Исполнитель
          <input value={artist} onChange={e => setArtist(e.target.value)}
            maxLength={120} placeholder="Имя исполнителя" />
        </label>

        <label>Ссылка на обложку (необязательно)
          <input type="url" value={cover} onChange={e => setCover(e.target.value)}
            placeholder="https://..." />
        </label>

        <button className="primary big" disabled={busy || tracks.length >= 20}>
          {busy ? "Добавляем…" : "＋ Добавить в плейлист"}
        </button>
      </form>

      {notice && <p className="profileMusicManagerNotice" role="status">{notice}</p>}

      <div className="profileMusicManagerList">
        <h4>Твой плейлист ({tracks.length}/20)</h4>
        {loading ? <p className="tiny">Загрузка списка…</p>
          : tracks.length === 0 ? <p className="tiny">Пока нет добавленных треков.</p>
          : tracks.map((track, i) => (
            <div className="profileMusicManagerItem" key={track.id}>
              <span>{String(i + 1).padStart(2, "0")}</span>
              <div>
                <strong>{track.title}</strong>
                <small>{track.artist || "Неизвестный исполнитель"}</small>
              </div>
              <button type="button" className="outline"
                onClick={() => void removeTrack(track.id)}>Удалить</button>
            </div>
          ))}
      </div>
    </div>
  );
}
