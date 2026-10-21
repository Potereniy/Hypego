"use client";

import { useEffect, useState } from "react";

export type ProfileVideoMode = "off" | "manual" | "auto";

export type ProfileVideoItem = {
  id: string;
  title: string;
  youtubeId?: string;
  videoUrl?: string;
  type?: "youtube" | "upload";
};

type Props = {
  mode: ProfileVideoMode;
  videos: ProfileVideoItem[];
  selectedVideoId?: string | null;
  intervalSeconds?: number;
};

export default function ProfileVideoBackground({
  mode,
  videos,
  selectedVideoId,
  intervalSeconds = 30,
}: Props) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (mode !== "auto" || videos.length < 2) return;

    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % videos.length);
    }, Math.max(10, intervalSeconds) * 1000);

    return () => window.clearInterval(timer);
  }, [mode, videos.length, intervalSeconds]);

  if (mode === "off" || videos.length === 0) return null;

  const selectedIndex = videos.findIndex(
    (video) => video.id === selectedVideoId
  );

  const video =
    mode === "manual" && selectedIndex >= 0
      ? videos[selectedIndex]
      : videos[index % videos.length];

  if (!video) return null;

  return (
    <div className="hypegoProfileVideoBackground" aria-hidden="true">
      {video.type === "upload" && video.videoUrl ? (
        <video
          key={video.videoUrl}
          className="hypegoProfileVideoElement"
          src={video.videoUrl}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
        />
      ) : video.youtubeId ? (
        <iframe
          key={video.youtubeId}
          className="hypegoProfileVideoElement"
          src={
            "https://www.youtube-nocookie.com/embed/" +
            encodeURIComponent(video.youtubeId) +
            "?autoplay=1&mute=1&controls=0&loop=1&playlist=" +
            encodeURIComponent(video.youtubeId) +
            "&playsinline=1&rel=0"
          }
          title="Фоновый видеоэдит профиля"
          allow="autoplay; encrypted-media; picture-in-picture"
          referrerPolicy="strict-origin-when-cross-origin"
          tabIndex={-1}
        />
      ) : null}

      <div className="hypegoProfileVideoOverlay" />
    </div>
  );
}
