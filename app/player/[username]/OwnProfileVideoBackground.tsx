"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import ProfileVideoBackground from "./ProfileVideoBackground";

type Settings = {
  mode: "off" | "manual" | "auto";
  selected_video_id: string | null;
  video_ids: string[];
  interval_seconds: number;
};

export default function OwnProfileVideoBackground() {
  const [settings, setSettings] = useState<Settings>({
    mode: "off",
    selected_video_id: null,
    video_ids: [],
    interval_seconds: 30,
  });

  useEffect(() => {
    let active = true;

    fetch("/api/profile/video-settings")
      .then(async (response) => {
        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || "Не удалось загрузить видеофон"
          );
        }

        return data.settings;
      })
      .then((value) => {
        if (!active || !value) return;

        const ids = Array.isArray(value.video_ids)
          ? value.video_ids.filter(
              (id: unknown): id is string =>
                typeof id === "string" &&
                (
                  /^yt:[A-Za-z0-9_-]{11}$/.test(id) ||
                  /^file:https?:\/\//.test(id) ||
                  /^[A-Za-z0-9_-]{11}$/.test(id)
                )
            )
          : [];

        const selected = value.selected_video_id || null;
        const videos = ids.length ? ids : selected ? [selected] : [];

        setSettings({
          mode: ["off", "manual", "auto"].includes(value.mode)
            ? value.mode
            : "off",
          selected_video_id: selected,
          video_ids: videos,
          interval_seconds: Number(value.interval_seconds) || 30,
        });
      })
      .catch((error) => {
        console.error("Profile video background:", error);
      });

    return () => {
      active = false;
    };
  }, []);

  const background = (
    <ProfileVideoBackground
      mode={settings.mode}
      selectedVideoId={settings.selected_video_id}
      intervalSeconds={settings.interval_seconds}
      videos={settings.video_ids.map((value) => {
        if (value.startsWith("file:")) {
          return {
            id: value,
            title: "Загруженный эдит",
            videoUrl: value.slice(5),
            type: "upload" as const,
          };
        }

        const youtubeId = value.startsWith("yt:")
          ? value.slice(3)
          : value;

        return {
          id: value,
          title: "YouTube эдит",
          youtubeId,
          type: "youtube" as const,
        };
      })}
    />
  );

  return typeof document !== "undefined"
    ? createPortal(background, document.body)
    : null;
}
