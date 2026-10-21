"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Track = {
  id: string;
  title: string;
  artist: string;
  audio_url: string;
  cover_url: string | null;
};

type Source = "audio" | "youtube" | "spotify" | "vk";

function getSource(raw: string): Source {
  try {
    const host = new URL(raw).hostname.toLowerCase().replace(/^www\./, "");
    if (["youtube.com", "m.youtube.com", "music.youtube.com", "youtu.be", "youtube-nocookie.com"].includes(host)) return "youtube";
    if (host === "open.spotify.com" || host === "spotify.link") return "spotify";
    if (["vk.com", "m.vk.com", "vk.ru", "m.vk.ru"].includes(host)) return "vk";
  } catch {}
  return "audio";
}

function getYouTubeEmbed(raw: string): string | null {
  try {
    const u = new URL(raw);
    const host = u.hostname.toLowerCase();
    const list = u.searchParams.get("list");
    let video = "";
    if (host === "youtu.be") video = u.pathname.split("/").filter(Boolean)[0] || "";
    else if (host.includes("youtube.com")) {
      video = u.searchParams.get("v") || "";
      const parts = u.pathname.split("/").filter(Boolean);
      if (!video && ["embed", "shorts", "live"].includes(parts[0])) video = parts[1] || "";
    }
    if (list && !video) return "https://www.youtube-nocookie.com/embed/videoseries?list=" + encodeURIComponent(list);
    if (video && /^[A-Za-z0-9_-]{6,20}$/.test(video)) {
      return "https://www.youtube-nocookie.com/embed/" + video + (list ? "?list=" + encodeURIComponent(list) : "");
    }
  } catch {}
  return null;
}

function getSpotifyEmbed(raw: string): string | null {
  try {
    const u = new URL(raw);
    if (u.hostname !== "open.spotify.com") return null;
    const match = u.pathname.match(/^\/(track|album|playlist|episode|show)\/([A-Za-z0-9]+)\/?$/);
    if (!match) return null;
    return "https://open.spotify.com/embed/" + match[1] + "/" + match[2] + "?utm_source=generator&theme=0";
  } catch {}
  return null;
}

export default function MusicPlayer({ username }: { username: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const track = tracks[index];
  const source = track ? getSource(track.audio_url) : "audio";
  const youtubeEmbed = track && source === "youtube" ? getYouTubeEmbed(track.audio_url) : null;
  const spotifyEmbed = track && source === "spotify" ? getSpotifyEmbed(track.audio_url) : null;

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetch("/api/profile/tracks?username=" + encodeURIComponent(username))
      .then(async response => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Не удалось загрузить музыку");
        return data.tracks as Track[];
      })
      .then(list => {
        if (!active) return;
        setTracks(Array.isArray(list) ? list : []);
        setIndex(0);
        setError("");
      })
      .catch((e: Error) => {
        if (active) setError(e.message || "Ошибка загрузки плейлиста");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [username]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    setPlaying(false);
    setCurrent(0);
    setDuration(0);
    if (!track || getSource(track.audio_url) !== "audio") return;

    audio.volume = volume;
    const attempt = audio.play();
    if (attempt) attempt.then(() => setPlaying(true)).catch(() => setPlaying(false));
  }, [track?.id]);

  const togglePlay = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || !track || source !== "audio") return;
    if (audio.paused) {
      try {
        await audio.play();
        setPlaying(true);
        setError("");
      } catch {
        setPlaying(false);
        setError("Нажми Play ещё раз: браузер заблокировал автозапуск или ссылка недоступна.");
      }
    } else {
      audio.pause();
      setPlaying(false);
    }
  }, [track, source]);

  const changeTrack = (next: number) => {
    if (!tracks.length) return;
    setIndex((next + tracks.length) % tracks.length);
  };

  const formatTime = (seconds: number) => {
    if (!Number.isFinite(seconds)) return "0:00";
    return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
  };

  if (loading) return <section className="profileMusic"><div className="profileMusicLoading">Загружаем музыку…</div></section>;

  if (!tracks.length) {
    return (
      <section className="profileMusic profileMusicEmpty">
        <div className="profileMusicEyebrow">HYPEGO SOUND SYSTEM</div>
        <h2>Музыка профиля</h2>
        <p>{error || "Здесь пока нет треков. Владелец профиля сможет добавить их в настройках."}</p>
      </section>
    );
  }

  return (
    <section className="profileMusic">
      <audio
        ref={audioRef}
        src={track && source === "audio" ? track.audio_url : undefined}
        preload="metadata"
        onTimeUpdate={e => setCurrent(e.currentTarget.currentTime)}
        onLoadedMetadata={e => setDuration(e.currentTarget.duration || 0)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => changeTrack(index + 1)}
        onError={() => {
          setPlaying(false);
          setError("Не удалось воспроизвести аудио. Проверь прямую ссылку на файл.");
        }}
      />

      <div className="profileMusicHeading">
        <div>
          <div className="profileMusicEyebrow">HYPEGO SOUND SYSTEM</div>
          <h2>Музыка профиля</h2>
        </div>
        <span className="profileMusicCount">{index + 1} / {tracks.length}</span>
      </div>

      <div className="profileMusicBody">
        <div className={"profileVinyl " + (playing || source !== "audio" ? "isSpinning" : "")}>
          <div className="profileVinylGrooves">
            {track.cover_url
              ? <img className="profileVinylCover" src={track.cover_url} alt={"Обложка " + track.title} />
              : <div className="profileVinylLabel">H+</div>}
          </div>
        </div>

        <div className="profileMusicDetails">
          <div className="profileMusicEyebrow">
            {source === "audio" ? "NOW PLAYING" : source === "youtube" ? "YOUTUBE" : source === "spotify" ? "SPOTIFY" : "VK MUSIC"}
          </div>
          <h3 title={track.title}>{track.title}</h3>
          <p>{track.artist || "Неизвестный исполнитель"}</p>

          {source === "audio" ? (
            <>
              <div className="profileMusicControls">
                <button type="button" aria-label="Предыдущий трек" onClick={() => changeTrack(index - 1)}>|◀</button>
                <button type="button" className="profileMusicPlay" aria-label={playing ? "Пауза" : "Воспроизвести"} onClick={togglePlay}>
                  {playing ? "Ⅱ" : "▶"}
                </button>
                <button type="button" aria-label="Следующий трек" onClick={() => changeTrack(index + 1)}>▶|</button>
              </div>

              <div className="profileMusicTimeline">
                <span>{formatTime(current)}</span>
                <input aria-label="Позиция воспроизведения" type="range" min={0}
                  max={duration || 1} step={1} value={Math.min(current, duration || 1)}
                  onChange={e => {
                    const value = Number(e.target.value);
                    if (audioRef.current) audioRef.current.currentTime = value;
                    setCurrent(value);
                  }} />
                <span>{formatTime(duration)}</span>
              </div>

              <label className="profileMusicVolume">
                <span>Громкость</span>
                <input aria-label="Громкость" type="range" min={0} max={1} step={0.05}
                  value={volume} onChange={e => {
                    const value = Number(e.target.value);
                    setVolume(value);
                    if (audioRef.current) audioRef.current.volume = value;
                  }} />
              </label>
            </>
          ) : null}
        </div>
      </div>

      {source === "youtube" && (
        youtubeEmbed
          ? <div className="profileMusicEmbed"><iframe src={youtubeEmbed} title={"YouTube: " + track.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin" allowFullScreen /></div>
          : <p className="profileMusicError">Не удалось распознать ссылку YouTube. <a href={track.audio_url} target="_blank" rel="noreferrer">Открыть оригинал</a></p>
      )}

      {source === "spotify" && (
        spotifyEmbed
          ? <div className="profileMusicEmbed profileMusicSpotify"><iframe src={spotifyEmbed} title={"Spotify: " + track.title}
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" /></div>
          : <p className="profileMusicError">Не удалось распознать ссылку Spotify. <a href={track.audio_url} target="_blank" rel="noreferrer">Открыть оригинал</a></p>
      )}

      {source === "vk" && (
        <div className="profileMusicExternal">
          <strong>Трек из VK</strong>
          <p>Доступность встроенного воспроизведения зависит от типа ссылки и настроек VK.</p>
          <a href={track.audio_url} target="_blank" rel="noreferrer">Открыть в VK ↗</a>
        </div>
      )}

      <div className="profileMusicPlaylist">
        {tracks.map((item, i) => (
          <button type="button" key={item.id}
            className={"profileMusicTrack " + (i === index ? "active" : "")}
            onClick={() => changeTrack(i)}>
            <span className="profileMusicTrackNumber">{i === index && playing ? "♫" : String(i + 1).padStart(2, "0")}</span>
            <span className="profileMusicTrackText">
              <strong>{item.title}</strong>
              <small>{item.artist || (getSource(item.audio_url) === "audio" ? "Аудиофайл" : getSource(item.audio_url).toUpperCase())}</small>
            </span>
            <span className="profileMusicTrackAction">{i === index && playing ? "Ⅱ" : "▶"}</span>
          </button>
        ))}
      </div>

      {error && <p className="profileMusicError">{error}</p>}
    </section>
  );
}
