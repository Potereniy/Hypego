"use client";

import { upload as uploadBlob } from "@vercel/blob/client";

import { useEffect, useState } from "react";

type Mode = "off" | "manual" | "auto";

type Settings = {
  mode: Mode;
  selected_video_id: string | null;
  video_ids: string[];
  interval_seconds: number;
};

function extractVideoId(value: string): string {
  const input = value.trim();
  if (/^[A-Za-z0-9_-]{11}$/.test(input)) return input;

  try {
    const url = new URL(input);
    let id = url.searchParams.get("v") || "";
    if (url.hostname === "youtu.be") {
      id = url.pathname.split("/").filter(Boolean)[0] || "";
    } else if (!id) {
      const parts = url.pathname.split("/").filter(Boolean);
      const marker = parts.findIndex((part) =>
        ["embed", "shorts", "live"].includes(part)
      );
      if (marker >= 0) id = parts[marker + 1] || "";
    }
    return /^[A-Za-z0-9_-]{11}$/.test(id) ? id : "";
  } catch {
    return "";
  }
}

const initial: Settings = {
  mode: "off",
  selected_video_id: null,
  video_ids: [],
  interval_seconds: 30,
};

export default function ProfileVideoSettings() {
  const [settings, setSettings] = useState<Settings>(initial);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/profile/video-settings")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Не удалось загрузить настройки");
        return data.settings;
      })
      .then((value) => {
        if (!active || !value) return;
        setSettings({
          mode: ["off", "manual", "auto"].includes(value.mode) ? value.mode : "off",
          selected_video_id: value.selected_video_id || null,
          video_ids: Array.isArray(value.video_ids) ? value.video_ids : [],
          interval_seconds: Number(value.interval_seconds) || 30,
        });
      })
      .catch((error) => {
        if (active) setMessage(error.message || "Ошибка загрузки");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, []);

  function addVideo() {
    const id = extractVideoId(input);
    if (!id) {
      setMessage("Вставь корректную ссылку на YouTube или ID ролика.");
      return;
    }
    if (settings.video_ids.includes(id)) {
      setMessage("Этот эдит уже есть в списке.");
      return;
    }
    if (settings.video_ids.length >= 30) {
      setMessage("Можно добавить не больше 30 эдитов.");
      return;
    }
    setSettings((current) => ({
      ...current,
      video_ids: [...current.video_ids, id],
      selected_video_id: current.selected_video_id || id,
    }));
    setInput("");
    setMessage("Эдит добавлен. Нажми «Сохранить настройки».");
  }

  
async function uploadVideo(file: File) {
  const allowed = ["video/mp4", "video/webm", "video/quicktime"];

  if (!allowed.includes(file.type)) {
    setMessage("Разрешены только MP4, WebM и MOV.");
    return;
  }

  if (file.size < 1 || file.size > 200 * 1024 * 1024) {
    setMessage("Видео должно быть размером до 200 МБ.");
    return;
  }

  setSaving(true);
  setMessage("Загружаем видео…");

  try {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");

    const blob = await uploadBlob(
      "profile-videos/" + Date.now() + "-" + safeName,
      file,
      {
        access: "public",
        handleUploadUrl: "/api/profile/video-upload",
      }
    );

    const videoId = "file:" + blob.url;

    setSettings((current) => ({
      ...current,
      mode: current.mode === "off" ? "manual" : current.mode,
      video_ids: [...new Set([...current.video_ids, videoId])],
      selected_video_id: current.selected_video_id || videoId,
    }));

    setMessage("Видео загружено. Нажми «Сохранить настройки».");
  } catch (error: any) {
    setMessage(error.message || "Не удалось загрузить видео");
  } finally {
    setSaving(false);
  }
}

async function save() {
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/profile/video-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: settings.mode,
          selectedVideoId: settings.selected_video_id,
          videoIds: settings.video_ids,
          intervalSeconds: settings.interval_seconds,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Не удалось сохранить настройки");
      setSettings((current) => ({
        ...current,
        ...data.settings,
        video_ids: Array.isArray(data.settings?.video_ids)
          ? data.settings.video_ids
          : current.video_ids,
      }));
      setMessage("Настройки сохранены.");
    } catch (error: any) {
      setMessage(error.message || "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  }

  const panel: React.CSSProperties = {
    margin: "16px 0",
    padding: 18,
    border: "1px solid rgba(167,139,250,.3)",
    borderRadius: 16,
    background: "rgba(15,17,29,.94)",
    color: "#f5f3ff",
  };
  const control: React.CSSProperties = {
    width: "100%",
    boxSizing: "border-box",
    padding: "10px 12px",
    borderRadius: 9,
    border: "1px solid #45405f",
    background: "#11111c",
    color: "inherit",
  };

  return (
    <section style={panel}>
      <span style={{ color: "#a78bfa", fontSize: 11, letterSpacing: 2 }}>
        PROFILE CUSTOMIZATION
      </span>
      <h2 style={{ margin: "6px 0 8px" }}>Видеоэдиты профиля</h2>
      <p style={{ opacity: .75, fontSize: 13 }}>
        Добавляй ролики YouTube, выбирай один или включай автосмену.
        Видео запускается без звука, чтобы не мешать музыкальному плееру.
      </p>

      {loading ? <p>Загружаем настройки…</p> : (
        <>
          <label style={{ display: "block", margin: "14px 0 6px" }}>Режим</label>
          <select
            style={control}
            value={settings.mode}
            onChange={(e) => setSettings({ ...settings, mode: e.target.value as Mode })}
          >
            <option value="off">Выключено</option>
            <option value="manual">Выбранный эдит</option>
            <option value="auto">Автоматическая смена</option>
          </select>

          <label style={{ display: "block", margin: "14px 0 6px" }}>
            Добавить ссылку на YouTube или ID ролика
          </label>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              style={control}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="https://youtu.be/XXXXXXXXXXX"
            />
            <button type="button" onClick={addVideo}>Добавить</button>
          </div>

          <div style={{
            marginTop: 12,
            padding: 12,
            border: "1px dashed #45405f",
            borderRadius: 10,
          }}>
            <label style={{ display: "block", marginBottom: 8 }}>
              Загрузить видео с устройства
            </label>

            <input
              type="file"
              accept="video/mp4,video/webm,video/quicktime"
              disabled={saving}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadVideo(file);
                e.currentTarget.value = "";
              }}
            />

            <div style={{
              marginTop: 6,
              fontSize: 12,
              opacity: .65,
            }}>
              MP4 / WebM / MOV, максимум 200 МБ
            </div>
          </div>

          {settings.video_ids.length > 0 && (
            <>
              <label style={{ display: "block", margin: "14px 0 6px" }}>
                Эдиты в каталоге ({settings.video_ids.length})
              </label>
              {settings.video_ids.map((id) => (
                <div key={id} style={{
                  display: "flex", gap: 8, alignItems: "center",
                  justifyContent: "space-between", padding: "8px 0",
                  borderBottom: "1px solid #302c42",
                }}>
                  <label style={{ display: "flex", gap: 8, alignItems: "center", minWidth: 0 }}>
                    <input
                      type="radio"
                      name="selectedProfileVideo"
                      checked={settings.selected_video_id === id}
                      onChange={() => setSettings({ ...settings, selected_video_id: id })}
                    />
                    <a
                      href={"https://www.youtube.com/watch?v=" + id}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: "#c4b5fd", overflowWrap: "anywhere" }}
                    >
                      {id}
                    </a>
                  </label>
                  <button
                    type="button"
                    onClick={() => setSettings((current) => {
                      const ids = current.video_ids.filter((item) => item !== id);
                      return {
                        ...current,
                        video_ids: ids,
                        selected_video_id: current.selected_video_id === id
                          ? ids[0] || null
                          : current.selected_video_id,
                      };
                    })}
                  >
                    Удалить
                  </button>
                </div>
              ))}
            </>
          )}

          {settings.mode === "auto" && (
            <>
              <label style={{ display: "block", margin: "14px 0 6px" }}>
                Интервал смены
              </label>
              <select
                style={control}
                value={settings.interval_seconds}
                onChange={(e) => setSettings({
                  ...settings,
                  interval_seconds: Number(e.target.value),
                })}
              >
                <option value={10}>10 секунд</option>
                <option value={30}>30 секунд</option>
                <option value={60}>1 минута</option>
                <option value={120}>2 минуты</option>
                <option value={300}>5 минут</option>
                <option value={600}>10 минут</option>
              </select>
              {settings.video_ids.length < 2 && (
                <p style={{ color: "#fbbf24", fontSize: 13 }}>
                  Для автосмены добавь минимум два эдита.
                </p>
              )}
            </>
          )}

          <button
            type="button"
            onClick={save}
            disabled={saving}
            style={{
              marginTop: 16, width: "100%", padding: 12, borderRadius: 10,
              border: 0, background: "#8b5cf6", color: "white",
              fontWeight: 700, cursor: saving ? "wait" : "pointer",
            }}
          >
            {saving ? "Сохраняем…" : "Сохранить настройки"}
          </button>
        </>
      )}
      {message && <p role="status" style={{ fontSize: 13 }}>{message}</p>}
    </section>
  );
}
