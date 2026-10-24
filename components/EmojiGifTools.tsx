'use client';

import { useState } from 'react';
import { isAllowedGifUrl, encodeGif } from '../lib/gif-url';

const EMOJIS = [
  '😀', '😂', '🥹', '😍', '😎', '😭',
  '🤔', '😡', '🔥', '❤️', '💜', '💀',
  '✨', '🎮', '👑', '💯', '👍', '👎',
  '🤝', '🎉', '⚡', '👀', '🚀', '🐱',
];


export function EmojiGifTools({
  value,
  onChange,
  maxLength,
}: {
  value: string;
  onChange: (value: string) => void;
  maxLength: number;
}) {
  const [showEmojis, setShowEmojis] = useState(false);
  const [gifUrl, setGifUrl] = useState('');
  const [gifError, setGifError] = useState('');

  function insertEmoji(emoji: string) {
    if (value.length + emoji.length > maxLength) return;
    onChange(value + emoji);
  }

  function addGif() {
    const url = gifUrl.trim();

    if (!isAllowedGifUrl(url)) {
      setGifError(
        'Нужна HTTPS-ссылка с tenor.com или giphy.com.'
      );
      return;
    }

    const marker = encodeGif(url);
    const next = value.trim()
      ? `${value.trim()} ${marker}`
      : marker;

    if (next.length > maxLength) {
      setGifError('Ссылка на GIF превышает лимит сообщения.');
      return;
    }

    onChange(next);
    setGifUrl('');
    setGifError('');
  }

  return (
    <div className="emojiGifTools">
      <div className="emojiGifButtons">
        <button
          type="button"
          className="outline"
          onClick={() => setShowEmojis(v => !v)}
          aria-expanded={showEmojis}
        >
          😀 Эмодзи
        </button>
      </div>

      {showEmojis && (
        <div className="emojiGifGrid">
          {EMOJIS.map(emoji => (
            <button
              type="button"
              key={emoji}
              onClick={() => insertEmoji(emoji)}
              aria-label={`Вставить ${emoji}`}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      <div className="emojiGifUrlRow">
        <input
          type="url"
          value={gifUrl}
          onChange={e => {
            setGifUrl(e.target.value);
            setGifError('');
          }}
          placeholder="HTTPS-ссылка на GIF с Tenor или GIPHY"
          aria-label="Ссылка на GIF"
        />
        <button
          type="button"
          className="outline"
          onClick={addGif}
          disabled={!gifUrl.trim()}
        >
          Добавить GIF
        </button>
      </div>

      {gifError && (
        <p className="emojiGifError" role="alert">
          {gifError}
        </p>
      )}
    </div>
  );
}
